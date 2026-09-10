#!/usr/bin/env node
/**
 * Standalone CLI for seal-klub-prover.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { evaluateContractSource } from './engine/evaluator.js';
import { runA2AHealingLoop } from './engine/a2a-loop.js';
import { SECURITY_RULES } from './engine/rules.js';
import { createProverServer } from './server.js';
function printBanner() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║  🛡️  Pact5-seal_Klub-Prover-v2.0 — Formal Verification & A2A Engine     ║
║  Engineered by not_bob & seal_klub                                       ║
╚══════════════════════════════════════════════════════════════════════════╝
`);
}
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    if (command === 'verify' || command === 'check') {
        const filePath = args[1];
        if (!filePath) {
            console.error('Error: specify a pact contract file to verify: seal-klub-prover verify <path/to/contract.pact>');
            process.exit(1);
        }
        const resolved = path.resolve(filePath);
        if (!fs.existsSync(resolved)) {
            console.error(`Error: file not found: ${resolved}`);
            process.exit(1);
        }
        const source = fs.readFileSync(resolved, 'utf-8');
        printBanner();
        console.log(`Analyzing: ${resolved} ...\n`);
        const evalResult = evaluateContractSource(source, filePath, {
            strictConservation: true,
            verifyCapabilities: true,
            verifyPostQuantumGuards: true
        });
        console.log(`Status: ${evalResult.violationCount === 0 ? '✅ MATHEMATICALLY_VERIFIED' : '❌ VERIFICATION_FAILED'}`);
        console.log(`Invariants Proven: ${evalResult.provenCount} | Violations: ${evalResult.violationCount}\n`);
        for (const p of evalResult.proofs) {
            const icon = p.status === 'PROVEN' ? '✅' : p.status === 'VIOLATION_DETECTED' ? '❌' : '⚠️';
            console.log(`${icon} [${p.ruleId || 'SMT'}] ${p.invariant} (${p.severity}): ${p.details}`);
            if (p.location)
                console.log(`   Line: ${p.location.line}`);
            if (p.patchSnippet)
                console.log(`   Patch: ${p.patchSnippet.split('\n')[0]}`);
        }
        if (evalResult.violationCount > 0)
            process.exit(1);
        process.exit(0);
    }
    if (command === 'heal' || command === 'fix') {
        const filePath = args[1];
        const writeBack = args.includes('--write') || args.includes('-w');
        if (!filePath) {
            console.error('Error: specify a contract file: seal-klub-prover heal <path/to/contract.pact> [--write]');
            process.exit(1);
        }
        const resolved = path.resolve(filePath);
        const source = fs.readFileSync(resolved, 'utf-8');
        printBanner();
        console.log(`Engaging A2A Self-Healing Loop for: ${resolved} ...\n`);
        const result = await runA2AHealingLoop(source, filePath, {
            maxIterations: 5,
            strictConservation: true
        });
        console.log(`A2A Loop Complete: ${result.converged ? '✅ CONVERGED (0 Violations)' : '⚠️ SATURATED'}`);
        console.log(`Total Iterations: ${result.totalIterations}`);
        for (const h of result.history) {
            console.log(`Iteration ${h.iteration}: Applied ${h.patchesApplied.length} patches -> ${h.remainingViolations} remaining.`);
        }
        if (writeBack && result.converged) {
            fs.writeFileSync(resolved, result.finalSource, 'utf-8');
            console.log(`\n💾 Successfully saved healed contract back to: ${resolved}`);
        }
        else if (!writeBack) {
            console.log('\n--- HEALED SOURCE ---\n');
            console.log(result.finalSource);
            console.log('\n(Pass --write to save changes to disk)');
        }
        process.exit(0);
    }
    if (command === 'serve') {
        let port = 3846;
        const portIdx = args.indexOf('--port');
        if (portIdx !== -1 && args[portIdx + 1]) {
            port = parseInt(args[portIdx + 1], 10) || 3846;
        }
        printBanner();
        const server = createProverServer({ port });
        server.listen(port, () => {
            console.log(`🚀 HTTP REST Server running on http://0.0.0.0:${port}`);
            console.log(`   Health: http://localhost:${port}/v1/health`);
            console.log(`   Rules:  http://localhost:${port}/v1/prover/rules`);
            console.log(`   Verify: POST http://localhost:${port}/v1/prover/verify`);
            console.log(`   Heal:   POST http://localhost:${port}/v1/prover/heal\n`);
        });
        return;
    }
    if (command === 'rules') {
        printBanner();
        console.log(`Total Rules & Invariants: ${SECURITY_RULES.length}\n`);
        for (const r of SECURITY_RULES) {
            console.log(`• [${r.id}] ${r.name} (${r.severity})`);
            console.log(`  ${r.description}`);
            console.log(`  Fix: ${r.remediationGuide}\n`);
        }
        process.exit(0);
    }
    printBanner();
    console.log(`Usage:
  seal-klub-prover verify <file.pact>      Formally verify contract against SMT and AST invariants
  seal-klub-prover heal <file.pact> [-w]   Run A2A autonomous self-healing loop (--write to save)
  seal-klub-prover serve [--port 3846]     Launch standalone HTTP REST API server
  seal-klub-prover rules                   Display full catalog of security and invariant rules
`);
}
main().catch(err => {
    console.error('Fatal CLI error:', err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map