/**
 * A2A Autonomous Self-Healing Feedback Loop Engine.
 */
import { evaluateContractSource } from './evaluator.js';
import { applyAutoPatches } from './patcher.js';
export async function runA2AHealingLoop(initialSource, filePath, options = {}) {
    const maxIterations = options.maxIterations ?? 5;
    let currentSource = initialSource;
    const history = [];
    let converged = false;
    let iteration = 0;
    let lastEval = evaluateContractSource(currentSource, filePath, options);
    while (iteration < maxIterations) {
        iteration++;
        const initialViolations = lastEval.violationCount;
        if (initialViolations === 0) {
            converged = true;
            break;
        }
        const initialRuleIds = lastEval.proofs
            .filter(p => p.status === 'VIOLATION_DETECTED')
            .map(p => p.ruleId || p.invariant);
        // 1. Try internal AST auto-patcher
        const { patchedSource: autoPatched, appliedPatches } = applyAutoPatches(currentSource, lastEval.proofs.filter(p => p.status === 'VIOLATION_DETECTED' || p.status === 'UNCONSTRAINED'));
        let nextSource = autoPatched;
        // 2. If custom A2A delegate provided, give subagent a pass
        if (options.customPatcherDelegate) {
            const delegateResult = await options.customPatcherDelegate(nextSource, lastEval.proofs.filter(p => p.status === 'VIOLATION_DETECTED'), iteration);
            if (delegateResult && delegateResult.length > 0) {
                nextSource = delegateResult;
                appliedPatches.push(`Agent-to-Agent custom delegate refactor applied in iteration ${iteration}.`);
            }
        }
        // 3. Re-evaluate patched source
        const newEval = evaluateContractSource(nextSource, filePath, options);
        const newRuleIds = newEval.proofs
            .filter(p => p.status === 'VIOLATION_DETECTED')
            .map(p => p.ruleId || p.invariant);
        const resolvedRules = initialRuleIds.filter(r => !newRuleIds.includes(r));
        history.push({
            iteration,
            initialViolations,
            patchesApplied: appliedPatches,
            remainingViolations: newEval.violationCount,
            resolvedRules
        });
        currentSource = nextSource;
        lastEval = newEval;
        if (newEval.violationCount === 0) {
            converged = true;
            break;
        }
        if (appliedPatches.length === 0 && (!options.customPatcherDelegate || nextSource === currentSource)) {
            break;
        }
    }
    return {
        finalSource: currentSource,
        converged,
        totalIterations: iteration,
        history,
        finalEvaluation: lastEval
    };
}
//# sourceMappingURL=a2a-loop.js.map