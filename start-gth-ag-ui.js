#!/usr/bin/env node
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveLocalBinOrExit, spawnLocalBin } from './scripts/local-bin.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve the AG-UI server binary from this repo's own install, before anything
// is started, so a missing dependency aborts while there is still nothing to
// tear down. Never a bare name: see scripts/local-bin.mjs for why.
const GTH_API_BIN = resolveLocalBinOrExit('@gaunt-sloth/agent', 'gaunt-sloth-api', __dirname);

// OPS-8: load the worktree-root `.env`. GTH_AGUI_PORT drives the gaunt-sloth AG-UI
// server + the web client's AGUI_URL target; WEB_PORT drives vite. Both are written
// per worktree by the allocator; the fallbacks below are the trunk defaults for a
// checkout with no `.env`. Inline env vars still win.
try { process.loadEnvFile(resolve(__dirname, '.env')); } catch { /* no .env: defaults */ }
const GTH_AGUI_PORT = process.env.GTH_AGUI_PORT || '3000';
const WEB_PORT = process.env.WEB_PORT || '5555';
const GTH_API_HEALTH_URL = `http://localhost:${GTH_AGUI_PORT}/health`;
const AGUI_URL = `http://localhost:${GTH_AGUI_PORT}/agents/default/run`;
const WEB_URL = `http://localhost:${WEB_PORT}`;
// OPS-16: the origin the browser will actually send, defaulted from the web client's own
// resolved URL — the same shape as ADK_CORS_ORIGINS in start-adk.js, an env var with a
// default that is threaded to the server on its command line. It has to be computed here
// because WEB_PORT is: the config file pins one origin and cannot know which port vite got.
const GTH_CORS_ORIGIN = process.env.GTH_CORS_ORIGIN || WEB_URL;
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;

function startGthAgUi() {
  const logPath = resolve(__dirname, 'start-gth-ag-ui.log');
  const bannerLines = [
    '  GAUNT SLOTH AG-UI — STARTING',
    '  Writing Server Logs to:',
    '  start-gth-ag-ui.log',
  ];
  const width = Math.max(...bannerLines.map(l => l.length)) + 2;
  const bar = '═'.repeat(width);
  const pad = l => `║${l}${' '.repeat(width - l.length)}║`;
  console.log([`╔${bar}╗`, ...bannerLines.map(pad), `╚${bar}╝`].join('\n'));

  const logStream = createWriteStream(logPath, { flags: 'w' });
  const proc = spawnLocalBin(
    GTH_API_BIN,
    [
      'ag-ui',
      // All three flags take effect. The port precedence is `--port`, then
      // `commands.api.port` from the config, then 3000 — so the flag is what
      // makes an allocated GTH_AGUI_PORT reach the server, over the 3000 the
      // config states. `--cors-origin` is the same story for the browser origin,
      // over the `cors.allowOrigin` the same config pins: without it a client on
      // any port but 5555 is refused by the preflight and every chat request
      // fails. `--config` names the file outright and refuses the run when it is
      // missing rather than quietly falling back to discovery. `cwd` below still
      // matters: it is the project root the guidelines and other project-relative
      // artifacts are found from.
      '--port', GTH_AGUI_PORT,
      '--cors-origin', GTH_CORS_ORIGIN,
      '--config', resolve(__dirname, 'examples/pukeko-gaunt-sloth-ag-ui/.gsloth.config.json'),
    ],
    {
      cwd: resolve(__dirname, 'examples/pukeko-gaunt-sloth-ag-ui'),
      stdio: ['inherit', 'pipe', 'pipe'],
      detached: true,
    }
  );

  proc.stdout.on('data', d => logStream.write(d));
  proc.stderr.on('data', d => logStream.write(d));
  proc.on('error', err => console.error(`[Gaunt Sloth AG-UI] ${err.message}`));

  return proc;
}

async function waitForUrl(url, label) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  process.stdout.write(`Waiting for ${label} (${url})`);
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      console.log(' ready');
      return;
    } catch {
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
  throw new Error(`${label} did not become ready within ${READY_TIMEOUT_MS / 1000}s`);
}

function killGroup(proc) {
  try { process.kill(-proc.pid, 'SIGTERM'); } catch { /* already gone */ }
}

const gthProc = startGthAgUi();

console.log('Starting Web Client...');
// Point the web client at the (possibly shifted) gaunt-sloth AG-UI URL via env,
// spawning web-client dev directly (the `web-ag-ui` script's inline AGUI_URL would
// shadow an inherited one).
const webProc = spawn('pnpm', ['--filter', '@galvanized-pukeko/web-client', 'run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  detached: true,
  env: { ...process.env, AGUI_URL },
});
webProc.on('error', err => console.error(`[Web Client] ${err.message}`));

function cleanup() {
  console.log('\nStopping services...');
  killGroup(gthProc);
  killGroup(webProc);
}

process.on('SIGINT', () => { cleanup(); process.exit(130); });
process.on('SIGTERM', () => { cleanup(); process.exit(143); });

try {
  await Promise.all([
    waitForUrl(GTH_API_HEALTH_URL, 'Gaunt Sloth AG-UI'),
    waitForUrl(WEB_URL, 'Web Client'),
  ]);
  console.log('\nAll services ready.');
  console.log(`  Gaunt Sloth AG-UI: http://localhost:${GTH_AGUI_PORT}`);
  console.log(`  Web Client       : ${WEB_URL}`);
  console.log(`  Allowed origin   : ${GTH_CORS_ORIGIN}`);
  console.log('\nPress Ctrl+C to stop.\n');
} catch (err) {
  console.error(`\nAborted: ${err.message}`);
  cleanup();
  process.exit(1);
}
