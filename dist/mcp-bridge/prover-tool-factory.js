/**
 * Drop-in MCP Tool Adapter Factory.
 * Allows any standard Model Context Protocol (MCP) server to register
 * the pact_seal_klub_prover tool using this standalone plugin.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { evaluateContractSource } from "../engine/evaluator.js";
import { runA2AHealingLoop } from "../engine/a2a-loop.js";
export const SealKlubProverInputShape = {
    filePath: z
        .string()
        .describe("Path to the .pact smart contract file to formally verify (relative to workspace root)."),
    strictConservation: z
        .boolean()
        .default(true)
        .describe("Require mathematical proof of balance column conservation delta = 0.0 across all transfer paths."),
    verifyCapabilities: z
        .boolean()
        .default(true)
        .describe("Verify that all table mutation operations require scoped capability authorization."),
    verifyPostQuantumGuards: z
        .boolean()
        .default(true)
        .describe("Verify NIST FIPS 205 SLH-DSA post-quantum principal compatibility and entropy constraints."),
    autoHeal: z
        .boolean()
        .default(false)
        .describe("Enable iterative A2A self-healing loop to automatically patch detected violations until verified."),
    maxIterations: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(5)
        .describe("Maximum number of A2A self-healing verification/patch iterations."),
    applyPatchesToFile: z
        .boolean()
        .default(false)
        .describe("If autoHeal is true, whether to write the final healed contract directly back to the file."),
    generateReport: z
        .boolean()
        .default(true)
        .describe("Generate a comprehensive GitHub-flavored Markdown formal verification audit report."),
    source: z
        .string()
        .optional()
        .describe("Optional inline Pact source code to verify directly.")
};
export const SealKlubProverInputSchema = z.object(SealKlubProverInputShape);
export function createSealKlubProverTool(ctx) {
    return async function sealKlubProver(args) {
        const input = SealKlubProverInputSchema.parse(args);
        let source = input.source;
        let targetPath = input.filePath;
        let resolvedFilePath = null;
        if (!source) {
            const resolved = path.resolve(ctx.workspaceRoot, input.filePath);
            if (!fs.existsSync(resolved)) {
                throw new Error(`Contract file not found: '${input.filePath}'`);
            }
            source = fs.readFileSync(resolved, "utf-8");
            targetPath = input.filePath;
            resolvedFilePath = resolved;
        }
        let finalSource = source;
        let autoHealEngaged = false;
        let healingIterations = 0;
        let healingHistory;
        let healedFileWritten = false;
        let evaluation;
        if (input.autoHeal) {
            autoHealEngaged = true;
            const a2aResult = await runA2AHealingLoop(source, targetPath, {
                maxIterations: input.maxIterations,
                strictConservation: input.strictConservation,
                verifyCapabilities: input.verifyCapabilities,
                verifyPostQuantumGuards: input.verifyPostQuantumGuards
            });
            finalSource = a2aResult.finalSource;
            healingIterations = a2aResult.totalIterations;
            healingHistory = a2aResult.history;
            evaluation = a2aResult.finalEvaluation;
            if (input.applyPatchesToFile && resolvedFilePath && a2aResult.converged) {
                fs.writeFileSync(resolvedFilePath, finalSource, "utf-8");
                healedFileWritten = true;
            }
        }
        else {
            evaluation = evaluateContractSource(source, targetPath, {
                strictConservation: input.strictConservation,
                verifyCapabilities: input.verifyCapabilities,
                verifyPostQuantumGuards: input.verifyPostQuantumGuards
            });
        }
        const { moduleName, proofs, provenCount, violationCount } = evaluation;
        const formalProofStatus = violationCount === 0 ? "MATHEMATICALLY_VERIFIED" : "VERIFICATION_FAILED";
        let report;
        if (input.generateReport !== false) {
            const proofRows = proofs
                .map(p => `| ${p.ruleId || "SMT"} | \`${p.invariant}\` | **${p.status}** | \`${p.severity}\` | ${p.details} | ${p.location ? `L${p.location.line}` : "-"} |`)
                .join("\n");
            let a2aSection = "";
            if (autoHealEngaged && healingHistory) {
                const histRows = healingHistory
                    .map(h => `| Iteration ${h.iteration} | ${h.initialViolations} | ${h.patchesApplied.join("<br>")} | ${h.remainingViolations} | ${h.resolvedRules.join(", ") || "None"} |`)
                    .join("\n");
                a2aSection = `
### 🔄 A2A Self-Healing Iteration Log

| Iteration | Initial Violations | Patches Applied | Remaining Violations | Resolved Invariants |
| :---: | :---: | :--- | :---: | :--- |
${histRows}
`;
            }
            report = `
# 🛡️ Pact5-seal_Klub-Prover-v2.0 Formal Verification Certificate
**Module**: \`${moduleName || "top-level"}\`  
**File**: \`${targetPath}\`  
**Engine**: \`Pact5-seal_Klub-Prover-v2.0\`  
**Contributor**: \`not_bob & seal_klub\`  
**Status**: **${formalProofStatus}** (${provenCount} Invariants Proven, ${violationCount} Violations)
${autoHealEngaged ? `**A2A Auto-Heal**: Engaged (${healingIterations} Iterations, Converged: ${formalProofStatus === "MATHEMATICALLY_VERIFIED"})` : ""}

---

### 📊 Verification Proof Matrix

| Rule ID | Invariant | Status | Severity | Specification Details | Location |
| :--- | :--- | :---: | :---: | :--- | :---: |
${proofRows}
${a2aSection}
---
*Verified using Pact5-seal_Klub-Prover-v2.0 AST Tokenizer, A2A Iterative Healer, SMT Balance Conservation Model, and NIST FIPS 205 Post-Quantum Security System.*
`;
        }
        return {
            content: [
                {
                    engine: "Pact5-seal_Klub-Prover-v2.0",
                    version: "2.0.0",
                    contributor: "not_bob & seal_klub",
                    file: targetPath,
                    moduleName,
                    formalProofStatus,
                    totalInvariantsChecked: proofs.length,
                    provenCount,
                    violationCount,
                    proofs,
                    autoHealEngaged,
                    healingIterations,
                    healingHistory,
                    healedSource: autoHealEngaged ? finalSource : undefined,
                    healedFileWritten,
                    summary: formalProofStatus === "MATHEMATICALLY_VERIFIED"
                        ? `Formal verification succeeded for ${targetPath}.${autoHealEngaged ? ` (A2A healed in ${healingIterations} iterations).` : ""} All ${provenCount} invariants mathematically closed.`
                        : `Formal verification detected ${violationCount} invariant violations in ${targetPath}. Review proof matrix for details.`,
                    report
                }
            ]
        };
    };
}
//# sourceMappingURL=prover-tool-factory.js.map