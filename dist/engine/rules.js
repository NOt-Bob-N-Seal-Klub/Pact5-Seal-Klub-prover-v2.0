/**
 * Security rules and formal invariant definitions for Pact smart contracts.
 */
export const SECURITY_RULES = [
    {
        id: 'PACT001',
        name: 'Capability Scoping & Guard Enforcement',
        type: 'capability-authorization',
        severity: 'HIGH',
        description: 'Ensures state mutations and sensitive operations require scoped capability authorization.',
        remediationGuide: 'Wrap state mutations with (with-capability ...) or check (enforce-guard ...).'
    },
    {
        id: 'PACT002',
        name: 'Least-Privilege Keyset Governance',
        type: 'keyset-governance',
        severity: 'MEDIUM',
        description: 'Prohibits overly permissive keysets such as (keys-any).',
        remediationGuide: 'Use keys-all or designated keyset references with explicit predicates.'
    },
    {
        id: 'PACT003',
        name: 'Zero Hardcoded Secrets / Private Keys',
        type: 'hardcoded-secret',
        severity: 'CRITICAL',
        description: 'Detects raw hex private keys, API secrets, and unmanaged tokens embedded in contract code.',
        remediationGuide: 'Remove hardcoded credentials and inject them dynamically via keyset messages at deployment.'
    },
    {
        id: 'PACT004',
        name: 'Time Manipulation & Block-Time Equality',
        type: 'time-manipulation',
        severity: 'MEDIUM',
        description: 'Prohibits exact equality on block timestamps to prevent miner manipulation.',
        remediationGuide: 'Use inequality operators (>=, <=, diff-time) rather than exact (=) timestamp comparisons.'
    },
    {
        id: 'PACT005',
        name: 'Token Arithmetic Precision',
        type: 'arithmetic-precision',
        severity: 'LOW',
        description: 'Enforces explicit rounding (round, floor, ceiling) on token arithmetic.',
        remediationGuide: 'Apply explicit (round ... 12) or precision bounds after decimal multiplication/division.'
    },
    {
        id: 'PACT006',
        name: 'External Input Validation',
        type: 'input-validation',
        severity: 'HIGH',
        description: 'Requires explicit bounds enforcement on parameters read via read-msg.',
        remediationGuide: 'Validate external message inputs using (enforce (> x 0.0) ...) bounds.'
    },
    {
        id: 'PACT007',
        name: 'Cross-Module Scoping',
        type: 'cross-module-call',
        severity: 'LOW',
        description: 'Ensures external module interactions occur under explicit capability authorization.',
        remediationGuide: 'Verify callers and capabilities before invoking external contract logic.'
    },
    {
        id: 'PACT008',
        name: 'Event Emission Ordering (CEI)',
        type: 'event-ordering',
        severity: 'MEDIUM',
        description: 'Enforces that state writes precede event emissions to prevent rollback observer desync.',
        remediationGuide: 'Place all (emit-event ...) calls strictly after table insert/update/write operations.'
    },
    {
        id: 'PACT009',
        name: 'Unbound Cross-Module Return Value',
        type: 'cross-module-call',
        severity: 'LOW',
        description: 'Requires binding of external call returns to prevent silent failures.',
        remediationGuide: 'Bind external call results using let/bind to ensure results are checked.'
    },
    {
        id: 'PACT010',
        name: 'Guarded Capability Declarations',
        type: 'capability-authorization',
        severity: 'HIGH',
        description: 'Prevents defcap declarations without keyset, guard, or @managed constraints.',
        remediationGuide: 'Add an enforce-guard, enforce-keyset, or @managed annotation to defcap bodies.'
    },
    {
        id: 'PACT011',
        name: 'Checks-Effects-Interactions (Reentrancy Prevention)',
        type: 'reentrancy-risk',
        severity: 'HIGH',
        description: 'Enforces internal state updates before external cross-module invocations.',
        remediationGuide: 'Execute state mutations before performing external cross-module calls.'
    },
    {
        id: 'PACT012',
        name: 'Non-Trivial Governance Capability',
        type: 'keyset-governance',
        severity: 'CRITICAL',
        description: 'Prohibits trivially passable governance checks like (enforce true).',
        remediationGuide: 'Replace trivial enforcement with (enforce-keyset ...) or (keyset-ref-guard ...).'
    },
    {
        id: 'SMT-001',
        name: 'SMT Balance Column Conservation',
        type: 'balance-conservation',
        severity: 'CRITICAL',
        description: 'Proves algebraic conservation of column delta balance = 0.0 across all paths.',
        remediationGuide: 'Annotate transfer functions with @model [(property (= (column-delta "balance") 0.0))].'
    },
    {
        id: 'SMT-002',
        name: 'Strict Non-Negative Amount Domain',
        type: 'non-negative-amounts',
        severity: 'HIGH',
        description: 'Proves that all mutating operations require strictly positive amount inputs (amount > 0.0).',
        remediationGuide: 'Add (enforce (> amount 0.0) "Amount must be strictly positive") at function entry.'
    },
    {
        id: 'SMT-003',
        name: 'Node Consensus Safety (Bind-Before-Enforce)',
        type: 'node-safety',
        severity: 'HIGH',
        description: 'Prohibits dynamic database reads inside enforce conditions to avoid mining node forks.',
        remediationGuide: 'Bind database values in a let-block before evaluating boolean conditions in enforce.'
    },
    {
        id: 'PQ-001',
        name: 'NIST FIPS 205 SLH-DSA Post-Quantum Guard Scheme',
        type: 'quantum-safety',
        severity: 'INFO',
        description: 'Validates post-quantum q: / x: principal scheme compatibility.',
        remediationGuide: 'Use hybrid or post-quantum guard formats compatible with Chainweb Node v3.2.2+.'
    }
];
//# sourceMappingURL=rules.js.map