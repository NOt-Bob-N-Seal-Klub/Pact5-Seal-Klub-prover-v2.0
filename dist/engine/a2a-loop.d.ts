/**
 * A2A Autonomous Self-Healing Feedback Loop Engine.
 */
import { evaluateContractSource } from './evaluator.js';
import type { A2ALoopOptions, A2AIterationLog } from './types.js';
export declare function runA2AHealingLoop(initialSource: string, filePath: string, options?: A2ALoopOptions): Promise<{
    finalSource: string;
    converged: boolean;
    totalIterations: number;
    history: A2AIterationLog[];
    finalEvaluation: ReturnType<typeof evaluateContractSource>;
}>;
//# sourceMappingURL=a2a-loop.d.ts.map