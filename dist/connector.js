/**
 * Universal Prover Connector Client.
 * Allows Node.js scripts, agents, MCP tools, and external services to connect
 * seamlessly to a local or remote seal-klub-prover daemon via HTTP or in-process.
 */
import { evaluateContractSource } from './engine/evaluator.js';
import { runA2AHealingLoop } from './engine/a2a-loop.js';
export class SealKlubProverConnector {
    endpointUrl;
    timeoutMs;
    constructor(options = {}) {
        this.endpointUrl = options.endpointUrl?.replace(/\/+$/, '');
        this.timeoutMs = options.timeoutMs ?? 10000;
    }
    /**
     * Health probe.
     */
    async health() {
        if (this.endpointUrl) {
            const res = await fetch(`${this.endpointUrl}/v1/health`, {
                signal: AbortSignal.timeout(this.timeoutMs)
            });
            return (await res.json());
        }
        return {
            status: 'in-process-active',
            engine: 'Pact5-seal_Klub-Prover-v2.0',
            version: '2.0.0'
        };
    }
    /**
     * Formally verifies a Pact contract.
     */
    async verify(source, filePath = 'contract.pact', options = {}) {
        if (this.endpointUrl) {
            const res = await fetch(`${this.endpointUrl}/v1/prover/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, filePath, ...options }),
                signal: AbortSignal.timeout(this.timeoutMs)
            });
            return (await res.json());
        }
        const evalResult = evaluateContractSource(source, filePath, options);
        const formalProofStatus = evalResult.violationCount === 0 ? 'MATHEMATICALLY_VERIFIED' : 'VERIFICATION_FAILED';
        return {
            engine: 'Pact5-seal_Klub-Prover-v2.0',
            version: '2.0.0',
            contributor: 'not_bob & seal_klub',
            file: filePath,
            moduleName: evalResult.moduleName,
            formalProofStatus,
            totalInvariantsChecked: evalResult.proofs.length,
            provenCount: evalResult.provenCount,
            violationCount: evalResult.violationCount,
            proofs: evalResult.proofs,
            summary: formalProofStatus === 'MATHEMATICALLY_VERIFIED'
                ? `Formal verification succeeded for ${filePath}. All invariants proven.`
                : `Formal verification detected ${evalResult.violationCount} violations in ${filePath}.`
        };
    }
    /**
     * Runs autonomous A2A self-healing loop.
     */
    async heal(source, filePath = 'contract.pact', options = {}) {
        if (this.endpointUrl) {
            const res = await fetch(`${this.endpointUrl}/v1/prover/heal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, filePath, ...options }),
                signal: AbortSignal.timeout(this.timeoutMs)
            });
            const data = (await res.json());
            return {
                formalProofStatus: data.formalProofStatus,
                converged: data.formalProofStatus === 'MATHEMATICALLY_VERIFIED',
                healingIterations: data.healingIterations,
                healedSource: data.healedSource,
                history: data.healingHistory || []
            };
        }
        const a2a = await runA2AHealingLoop(source, filePath, options);
        return {
            formalProofStatus: a2a.converged ? 'MATHEMATICALLY_VERIFIED' : 'VERIFICATION_FAILED',
            converged: a2a.converged,
            healingIterations: a2a.totalIterations,
            healedSource: a2a.finalSource,
            history: a2a.history
        };
    }
}
//# sourceMappingURL=connector.js.map