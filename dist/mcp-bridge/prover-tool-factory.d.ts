/**
 * Drop-in MCP Tool Adapter Factory.
 * Allows any standard Model Context Protocol (MCP) server to register
 * the pact_seal_klub_prover tool using this standalone plugin.
 */
import { z } from "zod";
import type { ProverResult } from "../engine/types.js";
export declare const SealKlubProverInputShape: {
    filePath: z.ZodString;
    strictConservation: z.ZodDefault<z.ZodBoolean>;
    verifyCapabilities: z.ZodDefault<z.ZodBoolean>;
    verifyPostQuantumGuards: z.ZodDefault<z.ZodBoolean>;
    autoHeal: z.ZodDefault<z.ZodBoolean>;
    maxIterations: z.ZodDefault<z.ZodNumber>;
    applyPatchesToFile: z.ZodDefault<z.ZodBoolean>;
    generateReport: z.ZodDefault<z.ZodBoolean>;
    source: z.ZodOptional<z.ZodString>;
};
export declare const SealKlubProverInputSchema: z.ZodObject<{
    filePath: z.ZodString;
    strictConservation: z.ZodDefault<z.ZodBoolean>;
    verifyCapabilities: z.ZodDefault<z.ZodBoolean>;
    verifyPostQuantumGuards: z.ZodDefault<z.ZodBoolean>;
    autoHeal: z.ZodDefault<z.ZodBoolean>;
    maxIterations: z.ZodDefault<z.ZodNumber>;
    applyPatchesToFile: z.ZodDefault<z.ZodBoolean>;
    generateReport: z.ZodDefault<z.ZodBoolean>;
    source: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    maxIterations: number;
    strictConservation: boolean;
    verifyCapabilities: boolean;
    verifyPostQuantumGuards: boolean;
    filePath: string;
    autoHeal: boolean;
    applyPatchesToFile: boolean;
    generateReport: boolean;
    source?: string | undefined;
}, {
    filePath: string;
    maxIterations?: number | undefined;
    strictConservation?: boolean | undefined;
    verifyCapabilities?: boolean | undefined;
    verifyPostQuantumGuards?: boolean | undefined;
    autoHeal?: boolean | undefined;
    applyPatchesToFile?: boolean | undefined;
    generateReport?: boolean | undefined;
    source?: string | undefined;
}>;
export type SealKlubProverInput = z.infer<typeof SealKlubProverInputSchema>;
export declare function createSealKlubProverTool(ctx: {
    workspaceRoot: string;
}): (args: unknown) => Promise<{
    content: ProverResult[];
}>;
//# sourceMappingURL=prover-tool-factory.d.ts.map