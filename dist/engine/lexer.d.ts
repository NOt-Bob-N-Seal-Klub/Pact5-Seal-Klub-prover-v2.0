/**
 * AST Lexer and form extractor for Pact smart contracts.
 */
export interface FunctionContext {
    name: string;
    kind: 'defun' | 'defcap' | 'defpact';
    startLine: number;
    endLine: number;
    body: string;
    strippedBody: string;
}
export interface ModuleContext {
    name: string;
    governance?: string | undefined;
    startLine: number;
    endLine: number;
    tables: string[];
    schemas: string[];
    functions: FunctionContext[];
}
export declare function stripCommentsAndStrings(source: string): string;
export declare function findFormEnd(lines: string[], startIdx: number): number;
export declare function extractForms(lines: string[], moduleIdx: number, moduleEnd: number): FunctionContext[];
export declare function parsePactSource(source: string): ModuleContext[];
export declare function findLineOffsetInFunction(fn: FunctionContext, pattern: RegExp): {
    line: number;
    evidence: string;
} | null;
//# sourceMappingURL=lexer.d.ts.map