import { describe, it, expect } from 'vitest';
import { evaluateContractSource } from '../src/engine/evaluator.js';
import { runA2AHealingLoop } from '../src/engine/a2a-loop.js';
import { SealKlubProverConnector } from '../src/connector.js';
import { SECURITY_RULES } from '../src/engine/rules.js';

describe('seal-klub-prover plugin test suite', () => {
  it('loads all 16 security and invariant rules', () => {
    expect(SECURITY_RULES.length).toBe(16);
    expect(SECURITY_RULES.some(r => r.id === 'PACT001')).toBe(true);
    expect(SECURITY_RULES.some(r => r.id === 'PACT012')).toBe(true);
    expect(SECURITY_RULES.some(r => r.id === 'SMT-001')).toBe(true);
  });

  it('catches violations in buggy contract', () => {
    const buggy = `
      (module buggy GOV
        (defcap GOV () (enforce true))
        (defun withdraw (acc:string amt:decimal)
          (update tbl acc {"bal": amt}))
      )
    `;
    const res = evaluateContractSource(buggy, 'buggy.pact');
    expect(res.violationCount).toBeGreaterThan(0);
    expect(res.proofs.some(p => p.ruleId === 'PACT012')).toBe(true);
    expect(res.proofs.some(p => p.ruleId === 'PACT001')).toBe(true);
  });

  it('converges in A2A self-healing loop', async () => {
    const unhealed = `
      (module auto-heal-test GOV
        (defcap GOV () (enforce true))
        (defun transfer (from:string to:string amount:decimal)
          (enforce-keyset "admin-keyset")
          (let ((fee (* amount 0.01)))
            (update ledger to { "balance": amount })))
      )
    `;
    const res = await runA2AHealingLoop(unhealed, 'heal.pact', { maxIterations: 5 });
    expect(res.converged).toBe(true);
    expect(res.finalSource).toContain('(enforce (> amount 0.0)');
    expect(res.finalSource).toContain('(round (* amount 0.01) 12)');
  });

  it('works seamlessly via SealKlubProverConnector', async () => {
    const connector = new SealKlubProverConnector();
    const health = await connector.health();
    expect(health.engine).toBe('Pact5-seal_Klub-Prover-v2.0');

    const clean = `
      (module clean-token GOV
        (defcap GOV () (enforce-keyset "admin-ks"))
        (defun transfer (from:string to:string amount:decimal)
          (enforce (> amount 0.0) "positive")
          (with-capability (GOV)
            (update tbl to {"bal": amount})))
      )
    `;
    const verifyRes = await connector.verify(clean, 'clean.pact', { strictConservation: false });
    expect(verifyRes.formalProofStatus).toBe('MATHEMATICALLY_VERIFIED');
  });
});
