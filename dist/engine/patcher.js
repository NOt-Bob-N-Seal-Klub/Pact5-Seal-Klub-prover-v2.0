/**
 * AST Code Patcher Subsystem.
 */
export function applyAutoPatches(source, violations) {
    let patched = source;
    const appliedPatches = [];
    for (const v of violations) {
        // 1. SMT Non-negative amounts fix
        if (v.invariant === 'smt-non-negative-amounts' && v.status === 'VIOLATION_DETECTED') {
            const match = patched.match(/(\(defun\s+(?:transfer|transfer-create|debit|credit)[^\n]*\n)/i);
            if (match && match[1] && !patched.includes('(enforce (> amount 0.0)')) {
                patched = patched.replace(match[1], `${match[1]}    (enforce (> amount 0.0) "Transfer amount must be strictly positive")\n`);
                appliedPatches.push('Injected strict non-negative amount constraint into transfer entrypoint.');
            }
        }
        // 2. SMT Balance column delta model annotation
        if (v.invariant === 'smt-balance-conservation' && v.status === 'UNCONSTRAINED') {
            if (!patched.includes("@model [(property (= (column-delta 'balance) 0.0))]")) {
                const defunMatch = patched.match(/(\n\s*\(defun\s+transfer)/i);
                if (defunMatch && defunMatch[1]) {
                    patched = patched.replace(defunMatch[1], `\n  @model [(property (= (column-delta 'balance) 0.0))]${defunMatch[1]}`);
                    appliedPatches.push('Injected formal SMT balance conservation model property annotation.');
                }
            }
        }
        // 3. PACT012: Trivial governance capability fix
        if (v.ruleId === 'PACT012') {
            const trivialGovPattern = /\(defcap\s+(?:GOV|GOVERNANCE|ADMIN)\s*\(\)\s*(?:\(enforce\s+true[^\)]*\)|\(enforce\s+1[^\)]*\)|true|\(\s*true\s*\))\)/i;
            if (trivialGovPattern.test(patched)) {
                patched = patched.replace(trivialGovPattern, '(defcap GOV () (enforce-guard (keyset-ref-guard "admin-keyset")))');
                appliedPatches.push('Patched trivial governance capability with strict admin-keyset guard.');
            }
        }
        // 4. PACT005: Token arithmetic precision rounding
        if (v.ruleId === 'PACT005') {
            const rawMultPattern = /\(\*\s+([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_.-]+)\)/;
            const rawDivPattern = /\(\/\s+([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_.-]+)\)/;
            if (rawMultPattern.test(patched) && !patched.includes('(round (*')) {
                patched = patched.replace(rawMultPattern, '(round (* $1 $2) 12)');
                appliedPatches.push('Wrapped token multiplication in explicit 12-decimal (round ...) bounds.');
            }
            else if (rawDivPattern.test(patched) && !patched.includes('(round (/')) {
                patched = patched.replace(rawDivPattern, '(round (/ $1 $2) 12)');
                appliedPatches.push('Wrapped token division in explicit 12-decimal (round ...) bounds.');
            }
        }
        // 5. PACT002: Overly permissive keys-any keyset
        if (v.ruleId === 'PACT002') {
            if (patched.includes('(keys-any)')) {
                patched = patched.replace(/\(keys-any\)/g, '(read-keyset "admin-keyset")');
                appliedPatches.push('Replaced permissive keys-any with least-privilege admin keyset.');
            }
        }
        // 6. PACT008: Event emitted before state write
        if (v.ruleId === 'PACT008') {
            const emitThenUpdatePattern = /(\s*)(\(emit-event\s+[^\)]+\))\s*\n(\s*)(\((?:update|insert|write)\s+[^\)]+\))/;
            if (emitThenUpdatePattern.test(patched)) {
                patched = patched.replace(emitThenUpdatePattern, '$1$4\n$3$2');
                appliedPatches.push('Re-ordered state write before emit-event (Checks-Effects-Interactions order).');
            }
        }
        // 7. PACT010: Unguarded defcap body
        if (v.ruleId === 'PACT010') {
            const capNameMatch = v.invariant.replace('unguarded-defcap-', '');
            const emptyCapPattern = new RegExp(`\\(defcap\\s+${capNameMatch}\\s*\\(\\)\\s*\\n?([^\\)]*)\\)`, 'i');
            if (emptyCapPattern.test(patched)) {
                patched = patched.replace(emptyCapPattern, `(defcap ${capNameMatch} ()\n    (enforce-guard (keyset-ref-guard "admin-keyset")))`);
                appliedPatches.push(`Guarded open capability '${capNameMatch}' with admin-keyset check.`);
            }
        }
    }
    return { patchedSource: patched, appliedPatches };
}
//# sourceMappingURL=patcher.js.map