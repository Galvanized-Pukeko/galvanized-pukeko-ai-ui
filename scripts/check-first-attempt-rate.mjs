#!/usr/bin/env node
// Guard: the first-attempt pass rate is still computed correctly, and can still be computed at all.
//
// QA-30. `scripts/first-attempt-rate.mjs` is what makes a retry-absorbed failure visible on this
// suite. Two separate things have to hold for it to be worth anything, and neither fails loudly on
// its own:
//
//   1. THE COMPUTATION. Asserted below against fixtures whose shape was captured from a real
//      Playwright JSON report (v1.61) — a clean cell, a cell that failed first and passed on a
//      retry, a hard failure, and a skip. Cases 5-7 are the ones that carry the reasoning: an
//      EMPTY report must be refused rather than formatted as a perfect score, results that are
//      not in retry order must still be read by `retry`, and a cell with no first attempt at all
//      must not be counted clean.
//
//   2. THE WIRING. A correct reader over a report nobody writes reports nothing. So the json
//      reporter's presence and its output path are pinned against `playwright.config.ts`, and so
//      is the existence of an explicit `timeout` — whose ABSENCE was the original QA-30 defect,
//      because it silently handed every test Playwright's 30 000 ms default while the specs stated
//      larger budgets they could never reach.
//
// The pins are on the FACILITY, not on the numbers: the budget's value is a decision to be made
// from measurement and re-made when the measurement changes, so this guard checks that the config
// states one at all rather than which one. Removing the reporter, renaming its output file, or
// deleting the `timeout` key all fail here.
//
// No browser, no server, no model: all of this is arithmetic over fixtures, so it runs anywhere.
//
// Run: node scripts/check-first-attempt-rate.mjs   (wired into "pnpm test")

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_REPORT_PATH, summarise, formatSummary } from './first-attempt-rate.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
function check(label, fn) {
  try {
    fn();
    console.log(`  ok   ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL ${label}\n       ${err.message}`);
  }
}

function assertEqual(actual, expected, what) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what}: expected ${e}, got ${a}`);
}

/**
 * One cell in the shape the JSON reporter emits: a spec carrying one test per project, whose
 * `results` carry a `retry` index and a status.
 */
function cell(title, line, results, status) {
  return {
    title,
    file: 'chat-gth-headless.spec.ts',
    line,
    tests: [{ projectName: 'chromium', expectedStatus: 'passed', status, results }],
  };
}

/** A report with one file suite holding the given specs. */
function report(specs) {
  return { suites: [{ title: 'chat-gth-headless.spec.ts', file: 'chat-gth-headless.spec.ts', specs }] };
}

const CLEAN = cell('a clean cell', 36, [{ retry: 0, status: 'passed', duration: 1300 }], 'expected');
const ABSORBED = cell(
  'round-trips the shared capture_image client tool',
  64,
  [
    { retry: 0, status: 'failed', duration: 30000 },
    { retry: 1, status: 'passed', duration: 25300 },
  ],
  'flaky'
);
const HARD_FAIL = cell(
  'a cell that never passes',
  99,
  [
    { retry: 0, status: 'failed', duration: 30000 },
    { retry: 1, status: 'failed', duration: 30000 },
  ],
  'unexpected'
);
const SKIPPED = cell('a skipped cell', 120, [{ retry: 0, status: 'skipped', duration: 0 }], 'skipped');

console.log('first-attempt rate — computation');

check('a clean run is the full rate', () => {
  const s = summarise(report([CLEAN, cell('another', 40, [{ retry: 0, status: 'passed' }], 'expected')]));
  assertEqual([s.clean, s.total, s.dirty], [2, 2, 0], 'clean run');
  assertEqual(s.absorbed, [], 'nothing absorbed');
});

check('a retry-absorbed cell lowers the rate and is named', () => {
  const s = summarise(report([CLEAN, ABSORBED]));
  assertEqual([s.clean, s.total], [1, 2], 'one of two clean');
  assertEqual(s.absorbed.length, 1, 'one absorbed cell');
  if (!s.absorbed[0].includes('capture_image')) {
    throw new Error(`absorbed label does not name the cell: ${s.absorbed[0]}`);
  }
  // The line that a run prints, which is the whole point of the facility.
  if (!formatSummary(s)[0].startsWith('first-attempt pass rate: 1/2 cells')) {
    throw new Error(`unexpected summary line: ${formatSummary(s)[0]}`);
  }
});

check('a hard failure is reported as failed, not as absorbed', () => {
  const s = summarise(report([CLEAN, HARD_FAIL]));
  assertEqual([s.clean, s.total], [1, 2], 'one of two clean');
  assertEqual(s.absorbed, [], 'a never-passing cell was not absorbed by a retry');
  assertEqual(s.failed.length, 1, 'one outright failure');
});

check('a skip is excluded from the denominator and is not counted clean', () => {
  const s = summarise(report([CLEAN, SKIPPED]));
  assertEqual([s.clean, s.total, s.skipped], [1, 1, 1], 'skip excluded');
});

check('an EMPTY report is refused rather than formatted as a perfect score', () => {
  let threw = false;
  try {
    summarise(report([]));
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('an empty report was summarised instead of refused');
  // And a report that is entirely skips is equally empty of attempts.
  let threwAllSkipped = false;
  try {
    summarise(report([SKIPPED]));
  } catch {
    threwAllSkipped = true;
  }
  if (!threwAllSkipped) throw new Error('an all-skipped report was summarised instead of refused');
});

check('the FIRST attempt is the one with retry 0, whatever order results arrive in', () => {
  const reversed = cell(
    'results out of order',
    64,
    [
      { retry: 1, status: 'passed', duration: 25300 },
      { retry: 0, status: 'failed', duration: 30000 },
    ],
    'flaky'
  );
  const s = summarise(report([reversed]));
  assertEqual([s.clean, s.total], [0, 1], 'read by retry index, not by array position');
});

check('a cell with no first attempt is not counted clean', () => {
  const s = summarise(report([cell('no retry 0', 64, [{ retry: 1, status: 'passed' }], 'flaky')]));
  assertEqual([s.clean, s.total, s.dirty], [0, 1, 1], 'unknown first attempt is not clean');
});

check('cells are found inside nested describe suites', () => {
  const nested = {
    suites: [
      {
        title: 'chat-gth-headless.spec.ts',
        file: 'chat-gth-headless.spec.ts',
        specs: [],
        suites: [{ title: 'Chat Interface', specs: [CLEAN, ABSORBED] }],
      },
    ],
  };
  const s = summarise(nested);
  assertEqual([s.clean, s.total], [1, 2], 'nested describe walked');
});

console.log('first-attempt rate — wiring');

const config = readFileSync(join(REPO_ROOT, 'playwright.config.ts'), 'utf8');

check('playwright.config.ts declares the json reporter at the pinned path', () => {
  if (!config.includes("'json'")) {
    throw new Error('the json reporter is gone from playwright.config.ts — nothing writes the report');
  }
  if (!config.includes(DEFAULT_REPORT_PATH)) {
    throw new Error(
      `the json reporter no longer writes ${DEFAULT_REPORT_PATH}, which is where the reader looks`
    );
  }
});

check('playwright.config.ts states an explicit test timeout', () => {
  if (!/^\s*timeout:\s*[\d_]+\s*,/m.test(config)) {
    throw new Error(
      'no explicit `timeout` in playwright.config.ts — every test silently falls back to ' +
        "Playwright's 30 000 ms default while the specs state larger budgets they cannot reach " +
        '(the original QA-30 defect)'
    );
  }
});

if (failures > 0) {
  console.error(`\nfirst-attempt rate: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nfirst-attempt rate: all checks passed');
