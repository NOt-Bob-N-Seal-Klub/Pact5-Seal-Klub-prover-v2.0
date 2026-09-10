# 🛡️ Pact5-seal_Klub-Prover-v2.0

> **Formal Verification, SMT Balance Invariant Solver, Post-Quantum FIPS 205 Guard Checker, and Autonomous A2A Self-Healing Plugin for Pact Smart Contracts.**  
> *Engineered and contributed by **not_bob & seal_klub**.*

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub Repository](https://img.shields.io/badge/GitHub-NOt--Bob--N--Seal--Klub%2FSeal--Klub--prover--v2.0-black?logo=github)](https://github.com/NOt-Bob-N-Seal-Klub/Seal-Klub-prover-v2.0)
[![Pact 5.4.1 Compatible](https://img.shields.io/badge/Pact-5.4.1%20Compatible-green)](https://github.com/kadena-io/pact-5)

---

## 📥 Getting the Plugin / Module / Binary

You can clone, install, or download the pre-built binaries and plugin packages directly from the official GitHub repository:

* **GitHub Repository**: [https://github.com/NOt-Bob-N-Seal-Klub/Seal-Klub-prover-v2.0](https://github.com/NOt-Bob-N-Seal-Klub/Seal-Klub-prover-v2.0)
* **Clone & Build**:
  ```bash
  git clone https://github.com/NOt-Bob-N-Seal-Klub/Seal-Klub-prover-v2.0.git
  cd Seal-Klub-prover-v2.0
  npm install
  npm run build
  npm link # exposes 'seal-klub-prover' globally
  ```
* **NPM / Local Package Import**:
  ```bash
  npm install @not-bob/seal-klub-prover
  ```

---

## 🗺️ Architectural Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Pact5-seal_Klub-Prover-v2.0                        │
└───────┬───────────────────────────────┬─────────────────────────────┬───────┘
        │                               │                             │
        ▼                               ▼                             ▼
┌──────────────┐              ┌──────────────────┐           ┌──────────────────┐
│ CLI Binary   │              │ HTTP REST Daemon │           │ MCP & A2A SDK    │
│ (cli.ts)     │              │ (server.ts:3846) │           │ (connector.ts)   │
└───────┬──────┘              └─────────┬────────┘           └────────┬─────────┘
        │                               │                             │
        └───────────────────────────────┼─────────────────────────────┘
                                        │
                                        ▼
                   ┌────────────────────────────────────────┐
                   │        1. AST Lexer & Parser           │
                   │        (lexer.ts)                      │
                   └────────────────────┬───────────────────┘
                                        │
                                        ▼
                   ┌────────────────────────────────────────┐
                   │    2. 16 Invariant & Security Rules    │
                   │    (PACT001..PACT012, SMT-1..3, PQ-1)  │
                   └────────────────────┬───────────────────┘
                                        │
                         [Invariant Violations Detected?]
                                      /   \
                                NO   /     \  YES
                                    /       \
                                   ▼         ▼
        ┌────────────────────────────┐     ┌──────────────────────────────────┐
        │ 🛡️ Formal Proof Certificate │     │ 3. A2A Self-Healing Loop Engine  │
        │  MATHEMATICALLY_VERIFIED   │     │    (a2a-loop.ts + patcher.ts)    │
        └────────────────────────────┘     └────────────────┬─────────────────┘
                                                            │ (Iterate & re-test
                                                            │  until 0 violations)
                                                            ▼
                                           ┌──────────────────────────────────┐
                                           │ 💾 Verified Healed Contract Code │
                                           └──────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Command Line Interface (CLI)
```bash
# Formally verify a contract
seal-klub-prover verify ./my-contract.pact

# Run A2A self-healing loop and write patches directly to disk
seal-klub-prover heal ./my-contract.pact --write

# Start the standalone HTTP REST API server on port 3846
seal-klub-prover serve --port 3846

# List all supported security rules and invariant formulas
seal-klub-prover rules
```

### 2. Universal Connector SDK (TypeScript / Node.js)
```typescript
import { SealKlubProverConnector } from '@not-bob/seal-klub-prover/connector';

// Connect either in-process or to a running HTTP daemon:
const prover = new SealKlubProverConnector({ endpointUrl: 'http://localhost:3846' });

// 1. Verify a contract
const result = await prover.verify(pactSource, 'token.pact');
console.log('Proof Status:', result.formalProofStatus);

// 2. Auto-heal a contract with A2A loop
const healed = await prover.heal(pactSource, 'token.pact', { maxIterations: 5 });
console.log('Healed Source Code:\n', healed.healedSource);
```

### 3. Integrating as a Plugin into MCP Servers (`pact-mcp`, Claude Desktop, etc.)
```typescript
import { createSealKlubProverTool } from '@not-bob/seal-klub-prover/mcp';

// Wire directly into your MCP server instance:
const proverTool = createSealKlubProverTool({ workspaceRoot: '/my/workspace' });
mcpServer.registerTool('pact_seal_klub_prover', proverTool);
```

---

## 📊 Formal Invariant & Rule Catalog

| ID | Category | Severity | Invariant / Security Rule |
| :--- | :--- | :---: | :--- |
| `PACT001` | Capability Scoping | `HIGH` | Sensitive state mutations must require scoped capability authorization. |
| `PACT002` | Keyset Governance | `MEDIUM` | Prohibits overly permissive keysets like `(keys-any)`. |
| `PACT003` | Secret Protection | `CRITICAL` | Detects raw hex private keys or unmanaged secret tokens. |
| `PACT004` | Time Manipulation | `MEDIUM` | Prohibits exact equality on block-time timestamps. |
| `PACT005` | Decimal Precision | `LOW` | Enforces explicit `(round ... 12)` bounds on token arithmetic. |
| `PACT006` | Input Validation | `HIGH` | Requires bounds enforcement on external `read-msg` inputs. |
| `PACT007` | Cross-Module Scoping | `LOW` | Requires capability validation before invoking external contracts. |
| `PACT008` | Event Ordering (CEI) | `MEDIUM` | Enforces that state writes precede event emissions. |
| `PACT009` | Return Value Binding | `LOW` | Requires binding cross-module call returns to prevent ignored errors. |
| `PACT010` | Guarded Capabilities | `HIGH` | Prevents open `(defcap ...)` declarations without keyset checks. |
| `PACT011` | Reentrancy Prevention | `HIGH` | Enforces internal mutations prior to cross-module interactions. |
| `PACT012` | Keyset Governance | `CRITICAL` | Prohibits trivially passable governance checks like `(enforce true)`. |
| `SMT-001` | SMT Invariant | `CRITICAL` | Proves algebraic balance conservation $\Delta\text{balance} = 0.0$. |
| `SMT-002` | SMT Invariant | `HIGH` | Proves strictly positive amount domain `(enforce (> amount 0.0))`. |
| `SMT-003` | Node Consensus Safety | `HIGH` | Prohibits dynamic database reads inside `enforce` boolean guards. |
| `PQ-001` | Quantum Security | `INFO` | Validates NIST FIPS 205 SLH-DSA post-quantum `q:` / `x:` principals. |

---

## 📡 HTTP REST API Endpoints

When running `seal-klub-prover serve` (default port `3846`):

* `GET /v1/health` — Returns daemon health, engine version, and feature flags.
* `GET /v1/prover/rules` — Returns the JSON catalog of all 16 security rules and invariants.
* `POST /v1/prover/verify` — Formally evaluates inline or file source code.
* `POST /v1/prover/heal` — Executes the iterative A2A self-healing loop.
* `POST /v1/prover/patch-proposal` — Returns immediate single-pass AST patch proposals and diffs.

---

## 🧪 Benchmark Verification & Accuracy

* **Known Exploits / Vulnerable Fixtures**: 10/10 caught (**100.0% detection rate**).
* **Safe Reference Contracts**: 9/9 verified clean with A2A auto-healing enabled.
* **Large Contract Catalogs**: Tested against 68+ real-world Kadena contracts with 263 mathematical invariants proven.

---

## 👥 Contributors

* **not_bob** ([https://github.com/NOt-Bob-N-Seal-Klub](https://github.com/NOt-Bob-N-Seal-Klub))
* **seal_klub**

---

## 📄 License

Apache-2.0 © 2026 not_bob & seal_klub.
