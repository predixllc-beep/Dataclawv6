# HYBRID ARCHITECTURE: DATACLAW (AI) x HUMMINGBOT (EXECUTION)

## A. SYSTEM ARCHITECTURE DESIGN
The system is bifurcated into a distributed Trading OS paradigm. Dataclaw acts exclusively as the intelligence and orchestration layer (the "Brain"), while Hummingbot acts exclusively as the deterministic execution layer (the "Hands"). They communicate asynchronously via an Event-Driven **Execution Bridge**.

```
[ DATACLAW (AI OS) ]
   ├── Agent Swarm (Onyx, Mirofish, Betafish)
   ├── Consensus Arbitrator
   ├── Signal & Intent Generator
   └── Persistent Ledger & State
        │
        ▼ (ZMQ / Redis PubSub / gRPC)
[ EXECUTION BRIDGE (Adapter Protocol) ]
   ├── Risk Gate (PolicyGuard Module)
   ├── Transformer (Intent -> Order Schema)
   └── Ledger & Lineage Trace
        │
        ▼ (Hummingbot Gateway API)
[ HUMMINGBOT (Execution Engine) ]
   ├── Order Routing
   ├── Slippage / Fill Management
   └── Exchange Connectivity
        │
        ▼
[ EXCHANGES (Binance, Hyperliquid, Bybit) ]
```

## B. EXECUTION BRIDGE SPECIFICATION
The Execution Bridge is a standalone microservice responsible for schema transformation and risk gating.

1. **Ingestion:** Receives JSON Intents from Dataclaw (`{ asset, direction, size_usd, confidence, ttl }`).
2. **Risk Gate:** Evaluates intent against hard-coded programmatic risk limits (Max DD, Leverage, Global Heat). This is absolute; AI cannot override it.
3. **Transformation:** Converts generic intent into exchange-specific or Hummingbot-specific `create_order` API payloads.
4. **State Machine:** Tracks order states (`PENDING`, `PARTIAL`, `FILLED`, `CANCELED`, `FAILED`).
5. **Auditor:** Logs the lineage trace linking the raw AI signal to the final exchange fill.

## C. RESPONSIBILITY MAP

**DATACLAW RESPONSIBILITIES:**
- **Intelligence Phase:** Pattern recognition, market state modeling, alpha generation.
- **Explainability:** Attaching the `DecisionTrace` (Why entry, why size, why stop).
- **Position Sizing:** Outputting suggested allocation targets (Kelly based).
- **Orchestration:** Managing the Swarm consensus and resolving agent conflicts.

**HUMMINGBOT RESPONSIBILITIES:**
- **Deterministic Action:** Firing orders exclusively based on gateway instructions.
- **Latency Arbitrage / Execution:** Handling order book micro-fluctuations during the fill process.
- **Failovers:** Handling exchange API rate limits and socket drops.
- **Reporting:** Returning discrete fill events back up the bridge.

## D. PLUGIN ONBOARDING PIPELINE
When a new repository is added to Dataclaw targeting the Execution/Analysis layer:
1. **Metadata Parsing:** AST/Regex analysis identifies the repo as `Indicator`, `Hummingbot Script`, `Model`, or `Data Feed`.
2. **Adapter Generation:** LLM-driven generation of a `bridge_adapter.py` that maps the repo's outputs to the Dataclaw schema.
3. **Sandbox Verification:** Executes a 15-minute simulated paper-trade epoch.
4. **Registry:** On success, registered into the `UnifiedInstallerService` and made available to the Swarm.

## E. RISK VALIDATION FLOW
Before any signal reaches Hummingbot, it traverses the `ExecutionBridge->PolicyGuard`:
- `Eval(GlobalHeatmap) < Max`
- `Eval(AgentConfidence) > Threshold`
- `Eval(MaxDrawdown) < HardLimit`
*Action:* Pass -> `Emit(OrderEvent)`. Fail -> `Emit(RejectionEvent)`.

## F. FEEDBACK LOOP ARCHITECTURE
Hummingbot generates discrete events (e.g., `OrderFilled`, `OrderFailed`).
- These events are pushed back via REST/Websocket to the Execution Bridge.
- The Execution Bridge updates the lineage trace.
- The Bridge notifies the Dataclaw `AgentOperatingDesk`.
- **Learning Cycle:** Agent state is updated with actual execution slippage. If slippage > predicted, agent's execution confidence metric is penalised.

## G. PRODUCTION DEPLOYMENT PLAN
1. **VM 1 (High CPU/RAM): Dataclaw OS.**
   - Runs React Frontend
   - Runs Node/Python FastAPI Backend
   - Ollama/Local LLMs instances
2. **VM 2 (High Bandwidth / Low Latency): Execution Engine.**
   - Runs Hummingbot Docker container
   - Runs Execution Bridge service
   - Colocated near Exchange endpoints (e.g., AWS Tokyo for Binance).
3. **Interconnect:** Secure VPC peering. No public internet exposure for the Hummingbot / Bridge interface.
