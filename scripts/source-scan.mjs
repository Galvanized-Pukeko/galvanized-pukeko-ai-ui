// Shared primitives for the guards that check what a source file DOES rather than what a module
// exports.
//
// Two guards here scan launcher sources, and for the same reason: what matters is not reachable by
// importing the module under test. A launcher that stopped calling the config resolver, or stopped
// taking the GPU lock, leaves every module-level check green while restoring the exact bug the
// check exists to prevent. Only reading the file notices.

/**
 * Blank out comments so a scan reads code, not prose.
 *
 * These launchers explain in their comments which file pins what, and those sentences quote module
 * names and function names the way ordinary prose does. Scanning raw source therefore reports a
 * launcher that is wired correctly — and, worse in the other direction, reports one that is NOT
 * wired as though it were, because a comment mentioning the call satisfies a search for the call.
 * A guard that cries wolf on correct code gets its finding suppressed rather than read; a guard
 * satisfied by a comment is no guard at all.
 *
 * Tracks string and template literals so a `//` inside one is not mistaken for a comment.
 */
export function stripComments(source) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (quote) {
      if (c === '\\') {
        out += c + (next ?? '');
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      out += c;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}
