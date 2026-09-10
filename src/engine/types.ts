/**
 * Core type definitions for Pact5-seal_Klub-Prover-v2.0 Engine.
 */

export interface InvariantProofResult {
  ruleId?: string | undefined;
  invariant: string;
  type:
    | 'balance-conservation'
    | 'capability-authorization'
    | 'non-negative-amounts'
    | 'quantum-safety'
    | 'node-safety'
    | 'keyset-governance'
    | 'time-manipulation'
    | 'arithmetic-precision'
    | 'input-validation'
    | 'cross-module-call'
    | 'event-ordering'
    | 'multistep-pact'
    | 'reentrancy-risk'
    | 'hardcoded-secret';
  status: 'PROVEN' | 'VIOLATION_DETECTED' | 'UNCONSTRAINED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  details: string;
  location?: { line: number; column?: number } | undefined;
  evidenceSnippet?: string | undefined;
  patchSnippet?: string | undefined;
  formalVerificationHint?: string | undefined;
  remediation?: string | undefined;
}

export interface A2AIterationLog {
  iteration: number;
  initialViolations: number;
  patchesApplied: string[];
  remainingViolations: number;
  resolvedRules: string[];
}

export interface EvaluationOptions {
  strictConservation?: boolean;
  verifyCapabilities?: boolean;
  verifyPostQuantumGuards?: boolean;
}

export interface ProverResult {
  engine: string;
  version: string;
  contributor: string;
  file: string;
  moduleName?: string | undefined;
  formalProofStatus: 'MATHEMATICALLY_VERIFIED' | 'VERIFICATION_FAILED' | 'SYNTAX_ERROR';
  totalInvariantsChecked: number;
  provenCount: number;
  violationCount: number;
  proofs: InvariantProofResult[];
  autoHealEngaged?: boolean | undefined;
  healingIterations?: number | undefined;
  healingHistory?: A2AIterationLog[] | undefined;
  healedSource?: string | undefined;
  healedFileWritten?: boolean | undefined;
  summary: string;
  report?: string | undefined;
}

export type AgentPatcherDelegate = (
  source: string,
  violations: InvariantProofResult[],
  iteration: number
) => Promise<string | null> | string | null;

export interface A2ALoopOptions extends EvaluationOptions {
  maxIterations?: number;
  customPatcherDelegate?: AgentPatcherDelegate;
}
