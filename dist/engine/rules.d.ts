/**
 * Security rules and formal invariant definitions for Pact smart contracts.
 */
export interface RuleDefinition {
    id: string;
    name: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    description: string;
    remediationGuide: string;
}
export declare const SECURITY_RULES: RuleDefinition[];
//# sourceMappingURL=rules.d.ts.map