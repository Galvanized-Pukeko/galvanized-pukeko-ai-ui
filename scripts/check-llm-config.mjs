#!/usr/bin/env node
// Guard: the AG-UI example's provider selection resolves, and every configuration it ships
// declares the provider its file name promises.
//
// Two failures this catches, both of which look fine until someone runs the demo:
//
//   1. A configuration file renamed, moved or deleted while a launcher still asks for it. The
//      launchers pass `--config`, which refuses a missing file rather than falling back, so the
//      symptom is a server that will not start at all.
//   2. A file whose name says one provider and whose `llm.type` says another. Selection is by
//      file name, so `GTH_LLM_PROVIDER=ollama` landing on a config that pins `openai` would send
//      someone with no API key to a provider that needs one — the exact problem the environment
//      variable exists to solve, reintroduced silently.
//
// It deliberately also checks that an UNKNOWN provider is refused. A resolver that ignored the
// environment and always returned the default would satisfy every other check here.
//
// No model is contacted and no key is read: this asserts which file is chosen and what that file
// declares, which is the whole of the selection behaviour.
//
// Run: node scripts/check-llm-config.mjs   (wired into "pnpm test")

import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AG_UI_EXAMPLE_DIR,
  DEFAULT_PROVIDER,
  PROVIDER_ENV_VAR,
  configFileNameFor,
  listAvailableProviders,
  resolveLlmConfig,
} from './llm-config.mjs';
// Shared with check-ollama-gpu-lock.mjs, which scans the same launchers for a different property.
import { stripComments } from './source-scan.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_DIR = resolve(ROOT, AG_UI_EXAMPLE_DIR);

const failures = [];
const fail = (msg) => failures.push(msg);

/** True when `target` is the directory `dir` itself or something beneath it. */
function isInside(dir, target) {
  const rel = relative(dir, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

const providers = listAvailableProviders(CONFIG_DIR);

if (providers.length === 0) {
  fail(`No Gaunt Sloth configurations found in ${AG_UI_EXAMPLE_DIR}.`);
}

if (!providers.includes(DEFAULT_PROVIDER)) {
  fail(
    `The fallback provider "${DEFAULT_PROVIDER}" has no configuration ` +
      `(${configFileNameFor(DEFAULT_PROVIDER)}), so an unset ${PROVIDER_ENV_VAR} cannot start.`
  );
}

// A keyless provider is the point of the exercise: without one, the example is still unrunnable
// for anyone who has not bought an API key, which is what this selection was added to fix.
const KEYLESS_PROVIDERS = ['ollama'];
if (!providers.some((p) => KEYLESS_PROVIDERS.includes(p))) {
  fail(
    `No keyless provider is configured. Expected one of: ${KEYLESS_PROVIDERS.join(', ')}. ` +
      `Without one the example cannot be run without a paid API key.`
  );
}

// Unset environment resolves to the documented fallback.
{
  const { provider, configPath, fromEnv, error } = resolveLlmConfig(CONFIG_DIR, {});
  if (error) fail(`Default resolution failed: ${error}`);
  if (provider !== DEFAULT_PROVIDER) {
    fail(`With ${PROVIDER_ENV_VAR} unset, expected "${DEFAULT_PROVIDER}", got "${provider}".`);
  }
  if (fromEnv) fail('Default resolution reported itself as coming from the environment.');
  if (error === undefined && !configPath.endsWith(configFileNameFor(DEFAULT_PROVIDER))) {
    fail(`Default resolution chose ${configPath}, not ${configFileNameFor(DEFAULT_PROVIDER)}.`);
  }
}

// Each shipped provider is selectable by name, and declares itself.
for (const provider of providers) {
  const { configPath, error, provider: got } = resolveLlmConfig(CONFIG_DIR, {
    [PROVIDER_ENV_VAR]: provider,
  });
  if (error) {
    fail(`${PROVIDER_ENV_VAR}="${provider}" did not resolve: ${error}`);
    continue;
  }
  if (got !== provider) {
    fail(`${PROVIDER_ENV_VAR}="${provider}" resolved to provider "${got}".`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (e) {
    fail(`${configPath} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
    continue;
  }

  const declared = parsed?.llm?.type;
  if (declared !== provider) {
    fail(
      `${configFileNameFor(provider)} is selected for provider "${provider}" but its ` +
        `llm.type is ${declared === undefined ? 'missing' : `"${declared}"`}.`
    );
  }
}

// An unknown provider is refused, not silently replaced by the default.
{
  const { error } = resolveLlmConfig(CONFIG_DIR, {
    [PROVIDER_ENV_VAR]: 'no-such-provider-should-never-exist',
  });
  if (!error) {
    fail(
      `An unknown ${PROVIDER_ENV_VAR} was accepted. It must be refused: falling back would ` +
        `start a server against a provider the caller did not ask for.`
    );
  }
}

// A malformed provider name is refused before it reaches the filesystem, so the name that
// decides the path and the name that appears in the listing are checked the same way.
//
// The traversal below is chosen to land on the repository's OWN package.json — a file that really
// exists. A name that merely fails to exist is refused by the missing-file branch whether or not
// the name is validated at all, so testing with one would pass against a resolver with no
// validation in it: the assertion has to be answerable only by the check it is aiming at.
{
  const traversal = 'ollama/../../../package';
  const { error, configPath } = resolveLlmConfig(CONFIG_DIR, { [PROVIDER_ENV_VAR]: traversal });
  if (!error) {
    fail(
      `${PROVIDER_ENV_VAR}="${traversal}" was accepted and resolved to ${configPath}. A name ` +
        `containing path separators must be rejected as malformed, not resolved outside ` +
        `${AG_UI_EXAMPLE_DIR}.`
    );
  }
  // The invariant behind that case, independent of the string used to probe it: an accepted
  // provider never names a file outside the example directory.
  if (!error && configPath && !isInside(CONFIG_DIR, configPath)) {
    fail(`Accepted provider "${traversal}" resolved outside the example directory: ${configPath}.`);
  }
}

// THE LAUNCHERS ACTUALLY GO THROUGH THE RESOLVER.
//
// Everything above tests the resolver module. None of it notices a launcher that stopped calling
// it: reverting one to the hardcoded `--config .../.gsloth.config.json` it used before leaves
// every check above green while restoring the very bug this node fixed. So the launchers are
// checked as sources — the same approach check-no-bare-launchers.mjs takes, and for the same
// reason: what matters is not reachable by importing the module under test.
const LAUNCHERS = [
  'start-gth-ag-ui.js',
  'it-gth-ag-ui.js',
  `${AG_UI_EXAMPLE_DIR}/start.js`,
];

// A quoted `.gsloth.config...` literal in a launcher: the hardcoded path this node removed.
// The resolver owns those names now, and it is not a launcher.
const HARDCODED_CONFIG_RE = /['"`][^'"`\n]*\.gsloth\.config[^'"`\n]*['"`]/;

for (const rel of LAUNCHERS) {
  const full = resolve(ROOT, rel);
  let source;
  try {
    source = readFileSync(full, 'utf8');
  } catch {
    fail(`Launcher ${rel} is missing; it must resolve its config through scripts/llm-config.mjs.`);
    continue;
  }

  if (!source.includes('llm-config.mjs')) {
    fail(`${rel} does not import scripts/llm-config.mjs, so ${PROVIDER_ENV_VAR} cannot reach it.`);
  }
  if (!source.includes('resolveLlmConfigOrExit')) {
    fail(
      `${rel} does not call resolveLlmConfigOrExit, so it does not read ${PROVIDER_ENV_VAR} ` +
        `and an unusable provider would not end the run before services start.`
    );
  }
  const hardcoded = HARDCODED_CONFIG_RE.exec(stripComments(source));
  if (hardcoded) {
    fail(
      `${rel} names a configuration file directly (${hardcoded[0]}). That bypasses ` +
        `${PROVIDER_ENV_VAR} and pins the provider again — pass the resolver's configPath instead.`
    );
  }
}

if (failures.length > 0) {
  console.error(`\nAG-UI example LLM configuration check failed (${failures.length}):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}

console.log(
  `AG-UI example LLM configuration OK ` +
    `(fallback "${DEFAULT_PROVIDER}"; selectable: ${providers.join(', ')}).`
);
