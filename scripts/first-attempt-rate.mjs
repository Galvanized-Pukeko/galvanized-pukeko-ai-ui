// QA-30 — the FIRST-ATTEMPT pass rate of a Playwright run, read back out of its JSON report.
//
// THE PROBLEM THIS EXISTS FOR. `playwright.config.ts` sets `retries: 3`. A cell that fails and
// then passes is reported as *flaky* and the run still exits 0, so `pnpm run it-gth-ag-ui` can
// print a confident `7 passed` over a suite where a live defect fired on the first attempt and was
// absorbed. That is not a hypothetical: five back-to-back runs of this suite exited 0 while only
// three were clean on first attempt, and the two defects underneath became QA-30 and QA-31.
//
// Retries are legitimate for genuinely ambient flakiness — a real load-sensitive browser suite
// without them is a coin toss — so the answer is not to remove them. The answer is that the
// first-attempt result must be RECOVERABLE from a run, so a regression cannot hide behind a retry.
// This module is that reader, and `it-gth-ag-ui.js` prints its summary at the end of every run.
//
// WHY A DENOMINATOR OF ZERO IS AN ERROR AND NOT 100%. A report with no cells in it means the JSON
// reporter did not run, or ran somewhere else — and "0 of 0 clean" formats as a perfect score. An
// empty result that reads as success is the exact shape of an assertion that cannot fail, so
// `summarise` refuses it and the CLI exits non-zero. `check-first-attempt-rate.mjs` pins that.
//
// Plain ESM, Node stdlib only — the harness that calls it is run by bare `node`.

import { readFileSync } from 'node:fs';

/** Where the json reporter is configured to write. Pinned by check-first-attempt-rate.mjs. */
export const DEFAULT_REPORT_PATH = 'test-results/results.json';

/**
 * Walk the report's nested suites and yield every cell — one per test per project.
 *
 * The JSON reporter nests a file suite, then one suite per `describe`, then specs, and a spec
 * carries one `test` per project. Recursion is over `suites` at every level because a `describe`
 * can nest arbitrarily deep, and specs can hang off any of those levels.
 */
function* eachCell(node, file = null) {
  const currentFile = node.file ?? file;
  for (const spec of node.specs ?? []) {
    for (const test of spec.tests ?? []) {
      yield { spec, test, file: spec.file ?? currentFile };
    }
  }
  for (const child of node.suites ?? []) {
    yield* eachCell(child, currentFile);
  }
}

/**
 * The first attempt's outcome for one cell.
 *
 * `retry === 0` is the identity of the first attempt, not `results[0]` — the array's order is the
 * reporter's business and a cell can carry results out of order. A cell with no retry-0 result at
 * all is reported as `unknown` rather than being quietly counted as clean.
 */
function firstAttemptOf(test) {
  const first = (test.results ?? []).find(r => r.retry === 0);
  if (!first) return 'unknown';
  if (first.status === 'skipped') return 'skipped';
  return first.status === 'passed' ? 'passed' : 'failed';
}

/**
 * Summarise a parsed Playwright JSON report.
 *
 * Skipped cells are excluded from the denominator: a skip is not an attempt, and counting one as
 * clean would let `test.skip` raise the rate.
 *
 * @throws if the report contains no runnable cells — see the note at the top of this file.
 */
export function summarise(report) {
  const cells = [];
  for (const { spec, test, file } of eachCell(report ?? {})) {
    cells.push({
      title: [spec.title].filter(Boolean).join(' '),
      file,
      line: spec.line,
      project: test.projectName ?? test.projectId ?? '',
      firstAttempt: firstAttemptOf(test),
      finalStatus: test.status ?? 'unknown',
      attempts: (test.results ?? []).length,
    });
  }

  const runnable = cells.filter(c => c.firstAttempt !== 'skipped');
  if (runnable.length === 0) {
    throw new Error(
      'no runnable cells in the Playwright JSON report — the json reporter did not write this ' +
        'report, or wrote it somewhere else. Refusing to format an empty run as a clean one.'
    );
  }

  const clean = runnable.filter(c => c.firstAttempt === 'passed');
  const dirty = runnable.filter(c => c.firstAttempt !== 'passed');
  // Absorbed: red on the first attempt, green in the end. These are the ones the exit code hides.
  const absorbed = dirty.filter(c => c.finalStatus === 'flaky' || c.finalStatus === 'expected');

  return {
    total: runnable.length,
    clean: clean.length,
    dirty: dirty.length,
    absorbed: absorbed.map(c => cellLabel(c)),
    failed: dirty.filter(c => !absorbed.includes(c)).map(c => cellLabel(c)),
    skipped: cells.length - runnable.length,
    cells,
  };
}

function cellLabel(c) {
  const where = [c.file, c.line].filter(v => v !== undefined && v !== null).join(':');
  return `${where} › ${c.title}${c.project ? ` [${c.project}]` : ''}`;
}

/** Render the summary as the lines a run prints. */
export function formatSummary(s) {
  const lines = [
    `first-attempt pass rate: ${s.clean}/${s.total} cells` +
      (s.skipped ? ` (${s.skipped} skipped, excluded)` : ''),
  ];
  for (const label of s.absorbed) {
    lines.push(`  absorbed by a retry (exit code does NOT show this): ${label}`);
  }
  for (const label of s.failed) {
    lines.push(`  failed outright: ${label}`);
  }
  return lines;
}

/** Read, summarise and format in one call. Throws on a missing or empty report. */
export function reportFirstAttemptRate(path = DEFAULT_REPORT_PATH) {
  const summary = summarise(JSON.parse(readFileSync(path, 'utf8')));
  return { summary, lines: formatSummary(summary) };
}

// CLI: `node scripts/first-attempt-rate.mjs [report.json] [--fail-on-retry]`
//
// Exits 0 on a clean read even when cells were absorbed, because the suite's verdict is the
// suite's to give and this is a reader, not a gate — `--fail-on-retry` is there for a caller
// that wants one. A missing or empty report exits 2: that is the facility being broken, which
// must not be reported as a perfect score.
if (import.meta.main) {
  const args = process.argv.slice(2);
  const failOnRetry = args.includes('--fail-on-retry');
  const path = args.find(a => !a.startsWith('--')) ?? DEFAULT_REPORT_PATH;
  try {
    const { summary, lines } = reportFirstAttemptRate(path);
    for (const line of lines) console.log(line);
    process.exit(failOnRetry && summary.dirty > 0 ? 1 : 0);
  } catch (err) {
    console.error(`first-attempt rate unavailable: ${err.message}`);
    process.exit(2);
  }
}
