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

export class ExecutionBridgeService {
  private activeOrders: Map<string, HummingbotOrder> = new Map();

  // Exchange connector mappings
  public static mapExchangeConnector(exchange: 'binance' | 'bybit' | 'okx'): { network: string; connector: string } {
    switch (exchange) {
      case 'binance': return { network: 'binance', connector: 'binance_perpetual' };
      case 'bybit': return { network: 'bybit', connector: 'bybit_perpetual' };
      case 'okx': return { network: 'okx', connector: 'okx_perpetual' };
      default: throw new Error("Unsupported exchange connector");
    }
  }

  // Pre-flight check / Risk Security Gate
  public async validateSafetyGate(signal: DataclawSignal): Promise<{ valid: boolean; reason?: string }> {
    // 1. Max Position Size (e.g. 100K)
    if (signal.position_size_usd > 100000) {
      return { valid: false, reason: "EXCEEDS_MAX_POSITION_SIZE" };
    }
    // 2. Max Leverage
    if (signal.leverage > 20) {
      return { valid: false, reason: "EXCEEDS_MAX_LEVERAGE" };
    }
    // 3. Confidence Threshold
    if (signal.confidence_score < 70) {
      return { valid: false, reason: "LOW_CONFIDENCE_SCORE" };
    }
    // 4. Duplicate Check
    if (this.activeOrders.has(signal.intent_id)) {
      return { valid: false, reason: "DUPLICATE_ORDER_INTENT" };
    }

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

    // Simulated Dispatch
    this.handleOrderUpdate(order.client_order_id, OrderState.SUBMITTED);
    
    // In a real environment, submit to gateway: axios.post('hummingbot_url/gateway', order)
    
    // Simulate successful open and fill
    setTimeout(() => {
      this.handleOrderUpdate(order.client_order_id, OrderState.OPEN);
      setTimeout(() => {
        this.handleOrderUpdate(order.client_order_id, OrderState.FILLED, {
          filled_price: signal.entry_price * 1.0001, // simulate tiny slippage
          slippage: 1.0, // 1 bps
          latency: 85 // 85ms execution time
        });
      }, 1000);
    }, 500);

    return order;
  }
}

// Global instance for preview environment
export const bridgeService = new ExecutionBridgeService();
