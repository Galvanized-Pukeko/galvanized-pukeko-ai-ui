import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 3,
  workers: 1,
  // QA-30 — THE EFFECTIVE TEST BUDGET. Stated here because this is the only place that
  // decides it: with no `timeout` key, Playwright's default 30 000 ms governed and every
  // larger per-assertion timeout in `e2e/**` was unreachable decoration. A failure then
  // reads `Test timeout of 30000ms exceeded` while its call log counts toward a budget the
  // test could never have been given, and anyone diagnosing it from the source reasons from
  // twice the real number.
  //
  // 150 000 ms is the sum of the per-step budgets of the longest test in `chat-gth-headless`
  // (30 000 navigation + 30 000 first turn + 45 000 resume + 15 000 DOM assertions = 120 000)
  // plus slack, so no per-assertion timeout in that spec is fiction. Each of those steps is
  // sized from a measurement recorded in the spec beside it, NOT from what makes a run green.
  //
  // This is a backstop, not the working budget: the per-assertion timeouts fire first and each
  // names its own step, which is the whole point — a hung step reds at its own budget with a
  // message that says which one, instead of every failure arriving as one anonymous test
  // timeout. A real stall still fails, and fails sooner than this number.
  timeout: 150_000,
  reporter: [
    ['list'], // You can keep other reporters
    ['html', { open: 'never' }],
    // QA-30 — machine-readable results so the FIRST-ATTEMPT pass rate is recoverable from a
    // run. `retries: 3` means a cell that failed and then passed is reported flaky and the run
    // still exits 0, so the exit code cannot show a live defect that a retry absorbed. The path
    // is pinned by scripts/check-first-attempt-rate.mjs, which is what stops this reporter
    // being dropped and the facility going quiet.
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    // OPS-8: track the shifted vite port (WEB_PORT); the it-*.js harnesses load `.env`.
    baseURL: `http://localhost:${process.env.WEB_PORT || 5555}`,
    // QA-30 — `on-first-retry` recorded a trace for the RETRY and not for the first attempt,
    // so the attempt that actually failed was the one attempt with no trace, and what got kept
    // was a recording of the run that passed. With retries absorbing live defects on this
    // suite, the first attempt is exactly the one worth keeping.
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
