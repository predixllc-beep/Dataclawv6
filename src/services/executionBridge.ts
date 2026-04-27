import { usePersistentStore } from '../state/persistentStore';

export enum OrderState {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  OPEN = 'OPEN',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED'
}

export interface HummingbotOrder {
  client_order_id: string;
  network: string;
  connector: string;
  type: string;
  order: {
    market: string;
    side: 'BUY' | 'SELL';
    order_type: 'LIMIT' | 'MARKET';
    price: string;
    amount: string;
    leverage: number;
    position_mode: 'ONEWAY' | 'HEDGE';
    client_order_id: string;
  };
  state: OrderState;
  createdAt: number;
}

export interface DataclawSignal {
  intent_id: string;
  agent_origin: string;
  symbol: string; // e.g. BTC-USDT
  direction: 'LONG' | 'SHORT';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  position_size_usd: number;
  leverage: number;
  confidence_score: number;
  order_type: 'LIMIT' | 'MARKET';
  ttl_seconds: number;
}

export interface GlobalRiskProfile {
  winRate: number; // Historical win rate (e.g. 0.60)
  payoffRatio: number; // Average win / average loss (e.g. 1.5)
  atrPercent: number; // Current volatility (e.g. 0.04 for 4%)
  portfolioHeat: number; // Current exposure as % of equity
  maxGlobalHeat: number; // Hard limit for exposure (e.g. 0.50)
  totalEquity: number; // Total portfolio value
}

export class RiskEngine {
  constructor(public profile: GlobalRiskProfile) {}

  public calculateKellyFraction(): number {
    const { winRate, payoffRatio } = this.profile;
    // Kelly Formula: W - ((1 - W) / R)
    const kelly = winRate - ((1 - winRate) / payoffRatio);
    return Math.max(0, kelly); 
  }

  public calculateDynamicPositionSize(signalConfidence: number): number {
    const kellyFraction = this.calculateKellyFraction();
    // Fractional Kelly (Half-Kelly) for safety
    const fractionalKelly = kellyFraction * 0.5;

    // Scale by confidence (e.g. 90/100)
    const confidenceScale = signalConfidence / 100.0;
    
    // Penalize size in high volatility (ATR)
    const volatilityPenalty = Math.max(0.5, 1 - (this.profile.atrPercent * 10)); // Arbitrary scaling for effect

    let targetFraction = fractionalKelly * confidenceScale * volatilityPenalty;

    // Check portfolio heat capacity
    const availableHeat = Math.max(0, this.profile.maxGlobalHeat - this.profile.portfolioHeat);
    const finalFraction = Math.min(targetFraction, availableHeat);

    return finalFraction * this.profile.totalEquity;
  }

  public getMaxDynamicLeverage(): number {
    // High volatility limits leverage
    const maxLev = 10;
    let safeLev = 0.05 / Math.max(this.profile.atrPercent, 0.005);
    return Math.floor(Math.min(safeLev, maxLev));
  }
}

export class ExecutionBridgeService {
  private activeOrders: Map<string, HummingbotOrder> = new Map();
  public riskEngine: RiskEngine = new RiskEngine({
    winRate: 0.58,
    payoffRatio: 1.6,
    atrPercent: 0.04,
    portfolioHeat: 0.15,
    maxGlobalHeat: 0.50,
    totalEquity: 100000
  });

  // Exchange connector mappings
  public static mapExchangeConnector(exchange: 'binance' | 'bybit' | 'okx' | 'polymarket' | string): { network: string; connector: string } {

    switch (exchange) {
      case 'binance': return { network: 'binance', connector: 'binance_perpetual' };
      case 'bybit': return { network: 'bybit', connector: 'bybit_perpetual' };
      case 'okx': return { network: 'okx', connector: 'okx_perpetual' };
      case 'polymarket': return { network: 'polygon', connector: 'polymarket_clob' };
      default: throw new Error("Unsupported exchange connector");
    }
  }

  // Pre-flight check / Risk Security Gate
  public async validateSafetyGate(signal: DataclawSignal): Promise<{ valid: boolean; reason?: string }> {
    // 1. Dynamic Max Position Size based on Kelly / Risk Engine
    const dynamicSize = this.riskEngine.calculateDynamicPositionSize(signal.confidence_score);
    if (signal.position_size_usd !== dynamicSize) {
      console.log(`[RISK ENGINE] Recalculating signal size from ${signal.position_size_usd} to Kelly sizing: ${dynamicSize.toFixed(2)}`);
      signal.position_size_usd = dynamicSize;
    }
    
    if (signal.position_size_usd < 10) { // Minimum order size
       return { valid: false, reason: "POSITION_SIZE_TOO_SMALL_OR_ZERO" };
    }

    // 2. Dynamic Max Leverage based on Volatility (ATR)
    const maxDynamicLev = this.riskEngine.getMaxDynamicLeverage();
    if (signal.leverage > maxDynamicLev) {
      console.log(`[RISK ENGINE] Truncating signal leverage ${signal.leverage}x to ATR-safe max ${maxDynamicLev}x`);
      signal.leverage = maxDynamicLev;
    }

    // 3. Confidence Threshold
    if (signal.confidence_score < 70) {
      return { valid: false, reason: "LOW_CONFIDENCE_SCORE" };
    }
    
    // 4. Duplicate Check
    if (this.activeOrders.has(signal.intent_id)) {
      return { valid: false, reason: "DUPLICATE_ORDER_INTENT" };
    }

    // Update global heat (Simulated state tracking)
    this.riskEngine.profile.portfolioHeat += (signal.position_size_usd / this.riskEngine.profile.totalEquity);

    return { valid: true };
  }

  // Transform intent to order schema
  public transformSignalToOrder(signal: DataclawSignal, exchange: 'binance' | 'bybit' | 'okx'): HummingbotOrder {
    const { network, connector } = ExecutionBridgeService.mapExchangeConnector(exchange);
    
    // Normalize amounts and prices
    const amountAsAsset = (signal.position_size_usd / signal.entry_price).toFixed(4);

    return {
      client_order_id: `dc_sig_${signal.intent_id}`,
      network,
      connector,
      type: 'create_order',
      order: {
        market: signal.symbol.replace('/', '-'),
        side: signal.direction === 'LONG' ? 'BUY' : 'SELL',
        order_type: signal.order_type,
        price: signal.entry_price.toFixed(4),
        amount: amountAsAsset,
        leverage: signal.leverage,
        position_mode: 'ONEWAY',
        client_order_id: `dc_sig_${signal.intent_id}`
      },
      state: OrderState.CREATED,
      createdAt: Date.now()
    };
  }

  // Lifecycle Tracker - Triggered by Hummingbot hooks/websockets
  public handleOrderUpdate(client_order_id: string, newState: OrderState, data?: any) {
    const order = this.activeOrders.get(client_order_id);
    if (!order) return;

    order.state = newState;
    
    console.log(`[BRIDGE] Order ${client_order_id} transitioned to ${newState}`);
    
    // In a real backend, we would emit this state back to the Dataclaw event bus
    // using WebSocket or Redis pub/sub.
    
    if (newState === OrderState.FILLED) {
      // Feedback loop info provided by execution layer
      const executionData = { ...data, latency: data?.latency ?? 0, slippage_bps: data?.slippage ?? 0 };
      this.transmitFeedbackToAI(order, executionData);
    }
  }

  private transmitFeedbackToAI(order: HummingbotOrder, executionData: any) {
    console.log(`[FEEDBACK LOOP] Forwarding execution metrics to AI Swarm`, executionData);
    // Push the event to agent's memory or Ledger
  }

  public async dispatch(signal: DataclawSignal, exchange: 'binance' | 'bybit' | 'okx' = 'binance') {
    console.log(`[BRIDGE] Received Signal ID: ${signal.intent_id}`);
    
    const gateResult = await this.validateSafetyGate(signal);
    if (!gateResult.valid) {
      console.warn(`[BRIDGE] Signal Rejected: ${gateResult.reason}`);
      return;
    }

    const order = this.transformSignalToOrder(signal, exchange);
    this.activeOrders.set(order.client_order_id, order);

    this.handleOrderUpdate(order.client_order_id, OrderState.SUBMITTED);
    
    try {
      const res = await fetch('/api/hummingbot/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           tokenId: signal.symbol,
           price: signal.entry_price,
           size: signal.position_size_usd,
           side: signal.direction
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const execResult = await res.json();
      
      this.handleOrderUpdate(order.client_order_id, OrderState.OPEN);
      setTimeout(() => {
        this.handleOrderUpdate(order.client_order_id, OrderState.FILLED, {
          filled_price: execResult.price,
          slippage: 1.0,
          latency: 50,
          txHash: execResult.txHash
        });
      }, 500);
      
      return order;
    } catch(e) {
      console.error(`[BRIDGE] Execution Failed:`, e);
      this.handleOrderUpdate(order.client_order_id, OrderState.FAILED);
    }
  }
}

// Global instance for preview environment
export const bridgeService = new ExecutionBridgeService();
