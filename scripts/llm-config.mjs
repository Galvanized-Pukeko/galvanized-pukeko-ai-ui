// Which Gaunt Sloth configuration the AG-UI launchers hand to `gaunt-sloth-api --config`.
//
// The example used to pin one file, and that file pinned an OpenAI model, so the whole
// documented flow needed an OPENAI_API_KEY before it would answer anything. The provider is
// now read from the environment: set GTH_LLM_PROVIDER to pick one of the configurations the
// example ships, or leave it unset and get the documented fallback.
//
// WHY SELECTION AND NOT INTERPOLATION. A Gaunt Sloth JSON config has no environment
// interpolation, so `"type": "${GTH_LLM_PROVIDER}"` is not a thing that resolves. The obvious
// alternative — a `.gsloth.config.js` module config whose `configure()` reads `process.env` —
// does not work either at the `@gaunt-sloth/agent` version this repository pins: the loader
// validates a module config's return value through a zod schema before anything builds a model,
// and that parse returns a plain-object clone. A raw `{ type, model }` spec comes back
// unrouted, and an already-built model instance comes back with its prototype gone, so the
// server has an `llm` with no `invoke`. Only the JSON branch builds a real client, because it
// routes to the provider module AFTER validation. Selecting between JSON files is therefore the
// mechanism that actually works here, not a workaround for one we could not be bothered to use.
//
// Adding a provider is dropping a `.gsloth.config.<provider>.json` next to the others — the
// resolution below is by convention, so nothing here needs editing. It does need that provider's
// LangChain package to be installed, because `@gaunt-sloth/core` imports it on demand and
// declares them all as peers; the repository ships the two it depends on.

import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** The environment variable that names the provider. */
export const PROVIDER_ENV_VAR = 'GTH_LLM_PROVIDER';

/**
 * The provider used when GTH_LLM_PROVIDER is unset — the documented fallback, and the historical
 * behaviour of this example. It needs an OPENAI_API_KEY to answer a prompt; `ollama` is the
 * shipped provider that needs no key at all.
 */
export const DEFAULT_PROVIDER = 'openai';

/** Example directory holding the configurations, relative to the repository root. */
export const AG_UI_EXAMPLE_DIR = 'examples/pukeko-gaunt-sloth-ag-ui';

/**
 * File name carrying a provider's configuration.
 *
 * The default provider keeps the plain `.gsloth.config.json` name rather than a suffixed one:
 * it is the file `gth` itself discovers in a directory, and the name every existing reference to
 * this example already uses.
 */
export function configFileNameFor(provider) {
  return provider === DEFAULT_PROVIDER
    ? '.gsloth.config.json'
    : `.gsloth.config.${provider}.json`;
}

/** Providers this example ships a configuration for, sorted, derived from what is on disk. */
export function listAvailableProviders(configDir) {
  const providers = new Set();
  for (const entry of readdirSync(configDir)) {
    if (entry === '.gsloth.config.json') {
      providers.add(DEFAULT_PROVIDER);
      continue;
    }
    const match = /^\.gsloth\.config\.([A-Za-z0-9][A-Za-z0-9_-]*)\.json$/.exec(entry);
    if (match) providers.add(match[1]);
  }
  return [...providers].sort();
}

/**
 * Resolve the configuration file for the provider named in `env`.
 *
 * Returns `{ provider, configPath, fromEnv, error }`. `error` is a ready-to-print string when the
 * named provider has no configuration file; the caller decides whether that ends the run. A
 * provider that was asked for and is not there is never silently replaced by the default — that
 * would boot a server against a model the caller did not choose and say nothing about it, which
 * is the same failure `--config` exists to prevent.
 */
export function resolveLlmConfig(configDir, env = process.env) {
  const requested = (env[PROVIDER_ENV_VAR] ?? '').trim();
  const fromEnv = requested.length > 0;
  const provider = fromEnv ? requested : DEFAULT_PROVIDER;
  const configPath = resolve(configDir, configFileNameFor(provider));

  if (!existsSync(configPath)) {
    const available = listAvailableProviders(configDir);
    return {
      provider,
      configPath,
      fromEnv,
      error:
        `${PROVIDER_ENV_VAR}="${provider}" names a provider this example has no configuration ` +
        `for.\nExpected ${configFileNameFor(provider)} in ${configDir}.\n` +
        `Available: ${available.join(', ') || '(none)'}.`,
    };
  }

  return { provider, configPath, fromEnv, error: undefined };
}

/**
 * Resolve as above, or print the reason and exit 1.
 *
 * Used by the launchers, which resolve this before starting anything: an unusable provider must
 * end the run while there is still nothing to tear down.
 */
export function resolveLlmConfigOrExit(configDir, env = process.env) {
  const resolved = resolveLlmConfig(configDir, env);
  if (resolved.error) {
    console.error(`\n${resolved.error}\n`);
    process.exit(1);
  }
  return resolved;
}
