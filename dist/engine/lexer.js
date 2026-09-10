/**
 * AST Lexer and form extractor for Pact smart contracts.
 */
const COMMENT_REGEX = /;.*$/gm;
const STRING_REGEX = /"(?:[^"\\]|\\.)*"/g;
export function stripCommentsAndStrings(source) {
    let stripped = source.replace(STRING_REGEX, m => '"' + ' '.repeat(Math.max(0, m.length - 2)) + '"');
    stripped = stripped.replace(COMMENT_REGEX, m => ' '.repeat(m.length));
    return stripped;
}
export function findFormEnd(lines, startIdx) {
    let balance = 0;
    let seenOpen = false;
    for (let i = startIdx; i < lines.length; i++) {
        const raw = lines[i];
        const clean = raw.replace(STRING_REGEX, m => ' '.repeat(m.length)).replace(COMMENT_REGEX, m => ' '.repeat(m.length));
        for (const c of clean) {
            if (c === '(') {
                balance++;
                seenOpen = true;
            }
            else if (c === ')') {
                balance--;
            }
        }
        if (seenOpen && balance <= 0) {
            return i;
        }
    }
    return lines.length - 1;
}
export function extractForms(lines, moduleIdx, moduleEnd) {
    const forms = [];
    const formPats = [
        [/\(defun\s+([\w-]+)/, 'defun'],
        [/\(defcap\s+([\w-]+)/, 'defcap'],
        [/\(defpact\s+([\w-]+)/, 'defpact']
    ];
    let i = moduleIdx;
    while (i <= moduleEnd) {
        const raw = lines[i];
        let matchedName = null;
        let matchedKind = 'defun';
        for (const [pat, kind] of formPats) {
            const m = raw.match(pat);
            if (m && m[1]) {
                matchedName = m[1];
                matchedKind = kind;
                break;
            }
        }
        if (matchedName) {
            const startLine = i + 1;
            const endIdx = findFormEnd(lines, i);
            const endLine = endIdx + 1;
            const bodyLines = lines.slice(i, endIdx + 1);
            const body = bodyLines.join('\n');
            const strippedBody = stripCommentsAndStrings(body);
            forms.push({
                name: matchedName,
                kind: matchedKind,
                startLine,
                endLine,
                body,
                strippedBody
            });
            i = endIdx + 1;
            continue;
        }
        i++;
    }
    return forms;
}
export function parsePactSource(source) {
    const lines = source.split('\n');
    const modules = [];
    const moduleStarts = [];
    for (let idx = 0; idx < lines.length; idx++) {
        const m = lines[idx].match(/\(module\s+([\w.-]+)/);
        if (m && m[1]) {
            moduleStarts.push({ idx, name: m[1] });
        }
    }
    for (let i = 0; i < moduleStarts.length; i++) {
        const { idx: moduleIdx, name: moduleName } = moduleStarts[i];
        let moduleEnd = findFormEnd(lines, moduleIdx);
        if (i + 1 < moduleStarts.length) {
            moduleEnd = Math.min(moduleEnd, moduleStarts[i + 1].idx - 1);
        }
        const modLine = lines[moduleIdx];
        const govMatch = modLine.match(/\(module\s+[\w.-]+\s+([\w-]+)/);
        const governance = govMatch ? govMatch[1] : undefined;
        const tables = [];
        const schemas = [];
        for (let j = moduleIdx; j <= moduleEnd; j++) {
            const line = lines[j];
            const tm = line.match(/\(deftable\s+([\w-]+)/);
            if (tm && tm[1])
                tables.push(tm[1]);
            const sm = line.match(/\(defschema\s+([\w-]+)/);
            if (sm && sm[1])
                schemas.push(sm[1]);
        }
        const functions = extractForms(lines, moduleIdx, moduleEnd);
        modules.push({
            name: moduleName,
            governance,
            startLine: moduleIdx + 1,
            endLine: moduleEnd + 1,
            tables,
            schemas,
            functions
        });
    }
    return modules;
}
export function findLineOffsetInFunction(fn, pattern) {
    const rawLines = fn.body.split('\n');
    const strippedLines = fn.strippedBody.split('\n');
    for (let i = 0; i < strippedLines.length; i++) {
        if (pattern.test(strippedLines[i])) {
            return {
                line: fn.startLine + i,
                evidence: rawLines[i] ? rawLines[i].trim() : ''
            };
        }
    }
    return null;
}
//# sourceMappingURL=lexer.js.map