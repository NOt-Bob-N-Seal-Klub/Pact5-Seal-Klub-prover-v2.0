/**
 * Universal Prover Connector Client.
 * Allows Node.js scripts, agents, MCP tools, and external services to connect
 * seamlessly to a local or remote seal-klub-prover daemon via HTTP or in-process.
 */
import type { ProverResult, EvaluationOptions } from './engine/types.js';
export interface ConnectorOptions {
    /** Optional base URL of a running seal-klub-prover HTTP server (e.g. http://localhost:3846) */
    endpointUrl?: string;
    /** Timeout in ms for HTTP calls (default 10000ms) */
    timeoutMs?: number;
}
export declare class SealKlubProverConnector {
    private endpointUrl?;
    private timeoutMs;
    constructor(options?: ConnectorOptions);
    /**
     * Health probe.
     */
    health(): Promise<{
        status: string;
        engine: string;
        version: string;
    }>;
    /**
     * Formally verifies a Pact contract.
     */
    verify(source: string, filePath?: string, options?: EvaluationOptions): Promise<ProverResult>;
    /**
     * Runs autonomous A2A self-healing loop.
     */
    heal(source: string, filePath?: string, options?: {
        maxIterations?: number;
        strictConservation?: boolean;
    }): Promise<{
        formalProofStatus: 'MATHEMATICALLY_VERIFIED' | 'VERIFICATION_FAILED';
        converged: boolean;
        healingIterations: number;
        healedSource: string;
        history: any[];
    }>;
}
//# sourceMappingURL=connector.d.ts.map