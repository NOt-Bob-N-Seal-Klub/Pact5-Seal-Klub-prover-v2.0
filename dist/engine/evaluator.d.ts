/**
 * Formal AST Evaluator and SMT Invariant Verification Engine.
 */
import type { InvariantProofResult, EvaluationOptions } from './types.js';
export declare function evaluateContractSource(source: string, filePath: string, options?: EvaluationOptions): {
    moduleName: string | undefined;
    proofs: InvariantProofResult[];
    provenCount: number;
    violationCount: number;
};
//# sourceMappingURL=evaluator.d.ts.map