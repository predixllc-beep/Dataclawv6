# PHASE 1 — REPOSITORY AUDIT: Dataclaw-v1 -> Autonomous Swarm

## 1. Hardcoded API Dependencies
**Finding:** The existing system relies heavily on direct external API calls (e.g., OpenAI/Anthropic/Gemini) with zero local-first fallback mechanisms.
**Impact:** Total system failure during API outages or rate limits.
**Fix:** Introduce `model_router.py` with `BaseProvider` and `LocalProvider` fallbacks.

## 2. Provider Lock-in
**Finding:** Prompts and agent contexts are strictly coupled to a single vendor's SDK structure.
**Impact:** Inability to seamlessly switch to cheaper/faster local alternatives (e.g., Llama-3, Mistral) for low-latency tasks.
**Fix:** Provider-agnostic task routing logic handling inference internally.

## 3. Static Agent Chains
**Finding:** The current architecture uses linear pipeline logic (`Agent A -> Agent B -> Output`). 
**Impact:** Brittleness. If one agent fails or returns degraded output, the pipeline collapses.
**Fix:** Implement graph-based `swarm_orchestrator.py` with dynamic weighting.

## 4. Repo Integration Bottlenecks
**Finding:** Missing unified mechanism to inject isolated strategies.
**Impact:** Codebase fragmentation when new indicators/alphas are implemented.
**Fix:** Create auto-registering `plugins/` directory driven by `plugin.yaml` manifests.

## 5. Missing Risk Controls & Black Swan Resilience
**Finding:** Risk handling is rudimentary or reactive rather than preventative.
**Impact:** Major drawdown potential during high-volatility events (flash crashes, rapid regime shifts).
**Fix:** Introduce `black_swan_guard.py` & `kill_switch.py` for sub-millisecond freeze protocols.

## 6. Fake-agent Prompt Wrappers vs Real Agents
**Finding:** "Agents" are largely static prompt templates rather than autonomous stateful entities with memory and self-critique.
**Impact:** No capacity for self-evolution or reinforcement learning.
**Fix:** Inject `EpisodicMemory`, `SelfCritique`, and `StrategyMutator`.

---
*Audit complete. Proceeding with Phase 2-11 Core Subsystem Code Generation...*
