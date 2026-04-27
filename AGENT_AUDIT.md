# PRINCIPAL ARCHITECT AUDIT: DATACLAW NEXUS (POULS)

## EXECUTIVE SUMMARY
The current architecture presents as an institutional-grade system visually, but fundamentally relies on pseudo-swarm intelligence, shallow state management, and black-box signal generation. The UX is improving but lacks deep observability into individual agent cognition and risk parameters. It is currently a "Level 2" AI copilot; the goal is "Level 4" autonomous execution.

## 1. CRITICAL WEAKNESSES & MISSING MODULES

### A. Pseudo-Swarm Intelligence
**Finding:** The "Swarm" is a visual gimmick. Agents are generating localized static JSON representations rather than engaging in true multi-agent deterministic voting, arbitration, or consensus.
**Resolution:** Implement a `ConsensusEngine`. Agents must submit proposed trades to an `Arbitrator` agent. The Arbitrator weighs confidence, conflict, and historical accuracy before execution.

### B. Black-Box Signal Generation
**Finding:** Signals appear with a confidence score and action, but the deeply-nested reasoning (the "Why") is hidden or non-existent.
**Resolution:** Introduce an `ExplainabilityModule`. Every signal must attach a `DecisionTrace` (Why Entry, Why Leverage, Why Size).

### C. Simplistic Risk & Margin Engine
**Finding:** Position sizing and leverage appear arbitrary or hardcoded.
**Resolution:** Must integrate a global `RiskEngine` that calculates dynamic sizing based on Kelly Criterion, volatility (ATR), and portfolio heat.

### D. Missing Agent Observability
**Finding:** Agents are blended into global lists. There is no way to interrogate an agent's individual performance, memory, or historical blunders.
**Resolution:** Build the `AgentOperatingDesk` (AOD). A dedicated, isolated dashboard for every deployed agent.

### E. Manual Plugin Architecture
**Finding:** The "Repo/API" system is just a list. It lacks intelligent onboarding, sandbox validation, or capability mapping.
**Resolution:** Create a `PluginMarketplace` and `OnboardingWizard` that parses repos and auto-generates tool interfaces.

---

## 2. REFACTOR PLAN (PHASE 1)

1.  **State Upgrades:** Expand `persistentStore` to include `DecisionTrace`, `AgentMemory`, `AgentJournal`, and `ConsensusState`.
2.  **Agent Operating Desk (AOD):** Create a dedicated route/view tailored for single-agent interrogation.
3.  **Explainability Overhaul:** Redesign the Signal Engine cards to explicitly break down Margin, Leverage, and Sizing logic.
4.  **Notification Copilot:** Implement a proactive toast/notification system that alerts on risk anomalies.

---

## 3. INSTANTIATING THE UPGRADE
Initiating Phase 1 builds:
- `AgentOperatingDesk.tsx`
- Risk Engine Overhaul in `persistentStore.ts`
- Explainability additions to `SignalEngine.tsx`
