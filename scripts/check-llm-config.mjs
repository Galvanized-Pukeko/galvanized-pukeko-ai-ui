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
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AG_UI_EXAMPLE_DIR,
  DEFAULT_PROVIDER,
  PROVIDER_ENV_VAR,
  configFileNameFor,
  listAvailableProviders,
  resolveLlmConfig,
} from './llm-config.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_DIR = resolve(ROOT, AG_UI_EXAMPLE_DIR);

const failures = [];
const fail = (msg) => failures.push(msg);

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
