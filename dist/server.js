/**
 * Standalone HTTP REST API & Webhook Server for seal-klub-prover.
 */
import http from 'node:http';
import { URL } from 'node:url';
import { evaluateContractSource } from './engine/evaluator.js';
import { runA2AHealingLoop } from './engine/a2a-loop.js';
import { applyAutoPatches } from './engine/patcher.js';
import { SECURITY_RULES } from './engine/rules.js';
function sendJson(res, statusCode, data) {
    const json = JSON.stringify(data, null, 2);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(json);
}
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 10 * 1024 * 1024) {
                reject(new Error('Payload too large (> 10MB)'));
            }
        });
        req.on('end', () => {
            try {
                if (!raw.trim())
                    resolve({});
                else
                    resolve(JSON.parse(raw));
            }
            catch {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}
export function createProverServer(config = {}) {
    return http.createServer(async (req, res) => {
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end();
            return;
        }
        try {
            const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
            const pathname = url.pathname;
            if (req.method === 'GET' && (pathname === '/v1/health' || pathname === '/health')) {
                return sendJson(res, 200, {
                    status: 'healthy',
                    engine: 'Pact5-seal_Klub-Prover-v2.0',
                    version: '2.0.0',
                    contributor: 'not_bob & seal_klub',
                    uptimeSeconds: Math.floor(process.uptime()),
                    capabilities: {
                        formalVerification: true,
                        autoHealA2A: true,
                        rulesCount: SECURITY_RULES.length,
                        postQuantumFips205: true,
                        smtConservation: true
                    }
                });
            }
            if (req.method === 'GET' && (pathname === '/v1/prover/rules' || pathname === '/rules')) {
                return sendJson(res, 200, {
                    count: SECURITY_RULES.length,
                    rules: SECURITY_RULES
                });
            }
            if (req.method === 'POST' && (pathname === '/v1/prover/verify' || pathname === '/verify')) {
                const body = await parseBody(req);
                if (!body.source) {
                    return sendJson(res, 400, { error: 'BAD_REQUEST', message: 'Missing "source" field in request body.' });
                }
                const filePath = body.filePath || 'contract.pact';
                const evaluation = evaluateContractSource(body.source, filePath, {
                    strictConservation: body.strictConservation ?? true,
                    verifyCapabilities: body.verifyCapabilities ?? true,
                    verifyPostQuantumGuards: body.verifyPostQuantumGuards ?? true
                });
                const formalProofStatus = evaluation.violationCount === 0 ? 'MATHEMATICALLY_VERIFIED' : 'VERIFICATION_FAILED';
                return sendJson(res, 200, {
                    engine: 'Pact5-seal_Klub-Prover-v2.0',
                    version: '2.0.0',
                    contributor: 'not_bob & seal_klub',
                    file: filePath,
                    moduleName: evaluation.moduleName,
                    formalProofStatus,
                    totalInvariantsChecked: evaluation.proofs.length,
                    provenCount: evaluation.provenCount,
                    violationCount: evaluation.violationCount,
                    proofs: evaluation.proofs,
                    summary: formalProofStatus === 'MATHEMATICALLY_VERIFIED'
                        ? `Formal verification succeeded for ${filePath}.`
                        : `Detected ${evaluation.violationCount} invariant violations.`
                });
            }
            if (req.method === 'POST' && (pathname === '/v1/prover/heal' || pathname === '/heal')) {
                const body = await parseBody(req);
                if (!body.source) {
                    return sendJson(res, 400, { error: 'BAD_REQUEST', message: 'Missing "source" field in request body.' });
                }
                const filePath = body.filePath || 'contract.pact';
                const loopResult = await runA2AHealingLoop(body.source, filePath, {
                    maxIterations: body.maxIterations ?? 5,
                    strictConservation: body.strictConservation ?? true
                });
                return sendJson(res, 200, {
                    engine: 'Pact5-seal_Klub-Prover-v2.0',
                    formalProofStatus: loopResult.converged ? 'MATHEMATICALLY_VERIFIED' : 'VERIFICATION_FAILED',
                    autoHealEngaged: true,
                    healingIterations: loopResult.totalIterations,
                    healingHistory: loopResult.history,
                    healedSource: loopResult.finalSource,
                    remainingViolations: loopResult.finalEvaluation.violationCount,
                    provenCount: loopResult.finalEvaluation.provenCount
                });
            }
            if (req.method === 'POST' && pathname === '/v1/prover/patch-proposal') {
                const body = await parseBody(req);
                if (!body.source) {
                    return sendJson(res, 400, { error: 'BAD_REQUEST', message: 'Missing "source" field.' });
                }
                let violations = body.violations;
                if (!violations) {
                    const evalResult = evaluateContractSource(body.source, 'proposal.pact');
                    violations = evalResult.proofs.filter(p => p.status === 'VIOLATION_DETECTED' || p.status === 'UNCONSTRAINED');
                }
                const { patchedSource, appliedPatches } = applyAutoPatches(body.source, violations);
                return sendJson(res, 200, {
                    appliedPatches,
                    patchCount: appliedPatches.length,
                    patchedSource
                });
            }
            return sendJson(res, 404, {
                error: 'NOT_FOUND',
                message: `Unknown route ${req.method} ${pathname}`,
                availableEndpoints: ['GET /v1/health', 'GET /v1/prover/rules', 'POST /v1/prover/verify', 'POST /v1/prover/heal']
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return sendJson(res, 500, { error: 'SERVER_ERROR', message: msg });
        }
    });
}
//# sourceMappingURL=server.js.map