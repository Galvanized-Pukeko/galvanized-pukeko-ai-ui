import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { resolveLocalBinOrExit, spawnLocalBin } from '../../scripts/local-bin.mjs';
import { PROVIDER_ENV_VAR, resolveLlmConfigOrExit } from '../../scripts/llm-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');

// This example directory has no package.json of its own; its dependencies are the
// repository's. Resolve from ROOT explicitly rather than leaning on the working
// directory, and do it before anything is started so a missing dependency aborts
// with nothing to tear down. Never a bare name: see scripts/local-bin.mjs.
const GTH_API_BIN = resolveLocalBinOrExit('@gaunt-sloth/agent', 'gaunt-sloth-api', ROOT);

// OPS-8: load the repository-root `.env`, which the port allocator writes per
// worktree — this example directory has none of its own, so the file lives at
// ROOT alongside the dependencies. GTH_AGUI_PORT is the gaunt-sloth AG-UI port
// (AGUI_PORT is the koog harness's); WEB_PORT is vite's, whose own config reads
// the same file from the same place. The fallbacks are the trunk defaults, so a
// checkout with no `.env` behaves exactly as it did. Inline env vars still win.
try { process.loadEnvFile(resolve(ROOT, '.env')); } catch { /* no .env: defaults */ }
const AGUI_PORT = Number(process.env.GTH_AGUI_PORT) || 3000;
const WEB_PORT = Number(process.env.WEB_PORT) || 5555;
const AGUI_URL = `http://localhost:${AGUI_PORT}/agents/default/run`;
// OPS-16: the origin the browser will send, defaulted from the web client's own port — the
// shape ADK_CORS_ORIGINS already uses in start-adk.js. `.gsloth.config.json` pins one origin
// and cannot know which port WEB_PORT moved the client to, so the launcher that resolved the
// port passes the matching origin down with it.
const WEB_URL = `http://localhost:${WEB_PORT}`;
const GTH_CORS_ORIGIN = process.env.GTH_CORS_ORIGIN || WEB_URL;
// QA-19: which provider's configuration to run. Resolved before anything starts, so an
// unknown GTH_LLM_PROVIDER ends the run with nothing to tear down. Unset falls back to the
// documented default; see scripts/llm-config.mjs for why this is a file choice rather than a
// value interpolated into one config.
const { provider: LLM_PROVIDER, configPath: LLM_CONFIG_PATH } = resolveLlmConfigOrExit(__dirname);
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;

const procs = [];

function cleanup() {
  console.log('\nStopping services...');
  for (const proc of procs) {
    try {
      process.kill(-proc.pid, 'SIGTERM');
    } catch {
      // already exited
    }
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

async function waitForReady(url, label) {
  const start = Date.now();
  while (Date.now() - start < READY_TIMEOUT_MS) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`  ${label} is ready`);
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`${label} did not become ready within ${READY_TIMEOUT_MS / 1000}s`);
}

// Start Gaunt Sloth AG-UI server
console.log(`Starting Gaunt Sloth AG-UI server on port ${AGUI_PORT}...`);
console.log(`  LLM provider: ${LLM_PROVIDER} (set ${PROVIDER_ENV_VAR} to change it)`);
const gthProc = spawnLocalBin(
  GTH_API_BIN,
  [
    'ag-ui',
    // All three flags take effect. The port precedence is `--port`, then
    // `commands.api.port` from the config, then 3000 — so the flag is what makes
    // an allocated GTH_AGUI_PORT reach the server, over the 3000 the config
    // states. `--cors-origin` does the same for the browser origin, over the
    // `cors.allowOrigin` in that config: without it a web client on any port but
    // the pinned one is refused by the preflight. `--config` names the file
    // outright and refuses the run when it is missing rather than quietly falling
    // back to discovery. `cwd` below still matters: it is the project root the
    // guidelines and other project-relative artifacts are found from.
    '--port', String(AGUI_PORT),
    '--cors-origin', GTH_CORS_ORIGIN,
    '--config', LLM_CONFIG_PATH,
  ],
  {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  }
);
procs.push(gthProc);

gthProc.stdout.on('data', (d) => process.stdout.write(`[gth] ${d}`));
gthProc.stderr.on('data', (d) => process.stderr.write(`[gth] ${d}`));
gthProc.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Gaunt Sloth exited with code ${code}`);
  }
});

// Wait for Gaunt Sloth to be ready
await waitForReady(`http://localhost:${AGUI_PORT}/health`, 'Gaunt Sloth');

// Start web client
console.log(`Starting web client on port ${WEB_PORT}...`);
const webProc = spawn(
  'pnpm',
  ['--filter', '@galvanized-pukeko/web-client', 'run', 'dev'],
  {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env: { ...process.env, AGUI_URL },
  }
);
procs.push(webProc);

webProc.stdout.on('data', (d) => process.stdout.write(`[web] ${d}`));
webProc.stderr.on('data', (d) => process.stderr.write(`[web] ${d}`));
webProc.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Web client exited with code ${code}`);
  }
});

// Wait for web client to be ready
await waitForReady(`http://localhost:${WEB_PORT}`, 'Web client');

console.log('\n========================================');
console.log(`  Open http://localhost:${WEB_PORT} in your browser`);
console.log('  Press Ctrl+C to stop all services');
console.log('========================================\n');

// Keep running
await new Promise(() => {});
