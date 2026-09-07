import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

// Real-browser proof that PLAT-23 theme overrides actually repaint a mounted
// component (see e2e/theme.visual.spec.ts + e2e/harness.ts). Scoped to this
// package: NOT the repo-root playwright.config.ts (that one's testDir is
// `./e2e` at the galvanized-pukeko repo root, scoped to the web-client app's
// own e2e suite — an unrelated, larger surface). This config's `webServer`
// serves a tiny standalone harness page via `e2e/vite.harness.config.ts`,
// not the library's real `vite.config.ts` (which builds a `lib` bundle, not a
// dev server with an index.html entry).
//
// Kept out of `pnpm test` (= `vitest run`, jsdom, fast, CI's default gate):
// a real Chromium launch + dev server has different setup/teardown and is
// slower. Run via the separate `pnpm test:visual` script.

// OPS-8/OPS-113: the harness port comes from the worktree's generated `.env`
// so that two worktrees can run `test:visual` at the same time, each against
// its own dev server. `VUE_UI_VISUAL_PORT` -> the harness port; absent, it
// falls back to today's 4319, so a checkout with no `.env` behaves exactly as
// trunk does.
//
// WHY `process.loadEnvFile` AND NOT vite's `loadEnv`. Both are already used in
// this repository — the root launchers (`start-adk.js`, `it-adk.js`,
// `it-gth-ag-ui.js`, `it-koog.js`) call `process.loadEnvFile`, and
// web-client's `vite.config.ts` calls `loadEnv`. A Playwright config is a
// plain node module, not a vite one: `loadEnv` would mean importing vite for
// a `.env` parse it does not otherwise need. `process.loadEnvFile` is built
// into node, adds no dependency, and matches the launchers this config sits
// beside. Precedence is the same as `loadEnv`'s and is what OPS-8 wants:
// values already in the environment win over the file, so an inline
// `VUE_UI_VISUAL_PORT=… pnpm test:visual` still overrides the allocation.
//
// ANCHORED ON THIS FILE, NOT ON `process.cwd()`. The `.env` is generated at the
// worktree repo root and this config sits two levels below it, so the path is
// resolved relative to the config itself — `pnpm test:visual` from the package
// dir, `pnpm -r run test:visual` from the root and a bare `playwright test`
// otherwise disagree about cwd. Playwright loads this config as ESM: only
// `import.meta.url` is defined here, and `__dirname` throws — unlike
// `e2e/vite.harness.config.ts`, which may use `__dirname` because vite's
// loader supplies it.
try {
  process.loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), '../..', '.env'))
} catch {
  /* no `.env` (a plain clone, or CI): fall through to the defaults below. */
}

const PORT = Number(process.env.VUE_UI_VISUAL_PORT) || 4319

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm exec vite --config e2e/vite.harness.config.ts --port ${PORT} --strictPort`,
    port: PORT,

    // OPS-113: never reuse a server this run did not start — not even locally.
    //
    // This used to be `!process.env.CI`, which meant "reuse, outside CI". Paired
    // with the hardcoded port, that is what made the defect severe rather than
    // merely annoying: a second worktree could not bind 4319 (`strictPort`), did
    // not have to, and silently attached to the FIRST worktree's server. It then
    // exercised that worktree's source and reported a pass — a wrong answer
    // wearing a right answer's clothes, which no amount of reading the output
    // would catch.
    //
    // Per-worktree ports make that collision rarer, NOT impossible, so reuse
    // cannot be re-justified on the grounds that the ports now differ: 4319 is
    // both the fallback above AND the allocation an offset-0 worktree receives,
    // so a checkout with no `.env` and an offset-0 worktree still land on the
    // same port. With reuse off, that case fails loudly on the `strictPort`
    // bind instead of passing against the wrong tree.
    //
    // What it costs is one dev-server start per run, which the harness pays in
    // well under the timeout below. That is the right trade for a suite whose
    // entire purpose is to be the thing jsdom cannot be: an honest render.
    reuseExistingServer: false,

    timeout: 30_000,
  },
})
