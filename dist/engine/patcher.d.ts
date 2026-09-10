/**
 * AST Code Patcher Subsystem.
 */
import type { InvariantProofResult } from './types.js';
export declare function applyAutoPatches(source: string, violations: InvariantProofResult[]): {
    patchedSource: string;
    appliedPatches: string[];
};
//# sourceMappingURL=patcher.d.ts.map