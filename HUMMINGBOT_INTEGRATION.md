# DATACLAW x HUMMINGBOT INTEGRATION ARCHITECTURE

## A. SYSTEM INTEGRATION ARCHITECTURE DIAGRAM

```text
=============================================================================
                          DATACLAW OS (AI LAYER)
=============================================================================
[ Agent Swarm ] -> [ Consensus Arbitrator ] -> [ Signal/Intent Generator ]
                               |
                               v (Internal Event Bus)
=============================================================================
                   EXECUTION BRIDGE (MIDDLEWARE LAYER)
=============================================================================
[ Risk Validation Gate ] ---> [ Schema Transformer ] ---> [ Lifecycle Tracker ]
                               |                                ^
                               v (REST / WebSocket)             | (Webhooks)
=============================================================================
                   HUMMINGBOT ENGINE (EXECUTION LAYER)
=============================================================================
[ Gateway Configurator ] -> [ Connector Routing ] -> [ Slip/Fill Management ]
                               |
                               v (Exchange APIs)
=============================================================================
                        LIVE EXCHANGES
=============================================================================
[    Binance    ]        [     Bybit     ]        [      OKX      ]
```

## B. SIGNAL TO EXECUTION SCHEMA (TRANSFORMATION)

**Input: Dataclaw Signal Intent**
```json
{
  "intent_id": "sig_0x9a8b7c",
  "agent_origin": "Mirofish",
  "symbol": "BTC-USDT",
  "direction": "BUY",
  "entry_price": 64500.00,
  "stop_loss": 62000.00,
  "take_profit": 68000.00,
  "position_size_usd": 50000.00,
  "leverage": 5,
  "confidence_score": 92.5,
  "order_type": "LIMIT",
  "ttl_seconds": 60
}
```

**Output: Normalized Hummingbot Gateway Instruction**
```json
{
  "network": "binance",
  "connector": "binance_perpetual",
  "type": "create_order",
  "order": {
    "market": "BTC-USDT",
    "side": "BUY",
    "order_type": "LIMIT",
    "price": "64500.00",
    "amount": "0.775", 
    "leverage": 5,
    "position_mode": "ONEWAY",
    "client_order_id": "dc_sig_0x9a8b7c"
  }
}
```

## C. HUMMINGBOT CONNECTOR MAPPING

Dataclaw's Vault credentials map strictly to Hummingbot connector namespaces via secure environment injection (never stored in plain text).

*   **Binance Futures:** `binance_perpetual` (Requires: `BINANCE_API_KEY`, `BINANCE_API_SECRET`)
*   **Bybit V5:** `bybit_perpetual` (Requires: `BYBIT_API_KEY`, `BYBIT_API_SECRET`)
*   **OKX:** `okx_perpetual` (Requires: `OKX_API_KEY`, `OKX_API_SECRET`, `OKX_PASSPHRASE`)

*Permissions Rule:* All API keys strictly verified for `ENABLE_TRADING` = True and `ENABLE_WITHDRAWALS` = False during Pre-flight evaluation.

## D. EXECUTION SAFETY GATE LOGIC (POLICYGUARD)

Before payload reaches Hummingbot Gateway, it must sequentially pass:

1.  **Duplicate Order Prevention**: `cache.get(intent_id) == null`
2.  **Max Position Limit**: `current_exposure("BTC-USDT") + intent.size_usd <= PORTFOLIO_LIMIT`
3.  **Hard Leverage Ceiling**: `intent.leverage <= MAX_ALLOWED_LEVERAGE`
4.  **Agent Confidence Floor**: `intent.confidence_score >= AGENT_MIN_CONFIDENCE`
5.  **Volatility Circuit Breaker**: `ATR(14) < VOLATILITY_THRESHOLD_MAX`
6.  **Cooldown Period**: `time_since_last_trade("BTC-USDT") > MIN_COOLDOWN_SEC`

*Action:* If ANY check fails -> Block Execution, emit Failure Event to Dataclaw `AgentOperatingDesk`.

## E. ORDER LIFECYCLE STATE MACHINE

```text
[CREATED] (Bridge)
    |
    v
[SUBMITTED] (Sent to Hummingbot)  ---> [REJECTED] (Exchange Denied)
    |
    v
[OPEN] (Resting on Orderbook) ---> [CANCELLED] (TTL Expiry / AI Override)
    |
    |------> [PARTIALLY_FILLED] (Slippage / Liquidity limits)
    |              |
    v              v
[FILLED] <---------| (Completed)
    |
    v
[FAILED] (Socket disconnect / System Exception)
```

## F. FEEDBACK LOOP DESIGN

Hummingbot actively streams execution resolution back to Dataclaw for ML reinforcement learning.

**Feedback Payload:**
```json
{
  "client_order_id": "dc_sig_0x9a8b7c",
  "status": "FILLED",
  "filled_price": 64505.50,
  "execution_latency_ms": 112,
  "slippage_bps": 0.85,
  "realized_pnl": 0.00,
  "order_book_snapshot_id": "obs_998877"
}
```
**Dataclaw AI Action:** Agent compares `expected_entry` vs `filled_price`. If `slippage_bps` continuously hurts expected value (EV), the Swarm adjusts limit bounds or lowers the confidence weighting of the executing agent.

## G. DEPLOYMENT MODEL

Institutional deployment via strict Docker compartmentalization over Virtual Private Cloud (VPC).

*   **VPC Subnet A (Intelligence - High Compute):**
    *   Container: `dataclaw-os` (React frontend, Node/FastAPI orchestration)
    *   Container: `dataclaw-redis` (Event Bus)
    *   Container: `local-llm-engine` (Ollama/vLLM)
*   **VPC Subnet B (Execution - Low Latency):**
    *   Container: `hummingbot-gateway` (API Layer)
    *   Container: `hummingbot-client` (Connector runtime)
    *   Container: `execution-bridge` (Risk gating & transformation)

*Security:* Subnet B has zero direct internet ingress. It only accepts intra-VPC RPC from Subnet A and egresses out to Whitelisted Exchange APIs. Exchange keys exist solely inside `hummingbot-client` encrypted keystores.
