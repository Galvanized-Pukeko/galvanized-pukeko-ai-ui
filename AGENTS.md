# Agents

## Working Repositories

The repositories we are working on are:

- `packages/galvanized-pukeko-agent-adk` — Java Spring Boot ADK agent (backend)
- `packages/galvanized-pukeko-vue-ui` — Vue UI source (compiled and deployed to web-client)
- `packages/galvanized-pukeko-web-client` — Web client host (serves Vue UI build, owns `config.json` and Playwright tests)
- `packages/gaunt-sloth-assistant` — TypeScript CLI tool for agent workflows

## Copies for Reference

Copies of important dependencies are available in the `./_readonly` directory for reference (do not edit):

- `./_readonly/langchainjs`
- `./_readonly/langgraphjs`
- `./_readonly/adk-java`
- `./_readonly/ag-ui` — AG-UI protocol SDKs
  - TypeScript SDK: `sdks/typescript/`
  - Java community SDK: `sdks/community/java/` (Spring server library at `servers/spring/`)

## NPM builds

From root directory:
    - `it-gth` - run integration tests for Gaunt Sloth Assistant
    - `test-gth` - run unit tests for Gaunt Sloth Assistant
    - `it-adk` - run integration tests for ADK agent
    - `it-adk-headed` - run integration tests for ADK agent in headed mode

## Playwright tests

- Config: `./playwright.config.ts` (base URL `http://localhost:5555`)
- Specs: `./e2e/` (e.g. `chat.spec.ts`)
- Integration test runners start required services before invoking Playwright

## Maven builds

Global maven is not available on this machine use `./mvnw` for java projects (`packages/galvanized-pukeko-agent-adk`)

## Local Development Registry (Verdaccio)

`@galvanized-pukeko/vue-ui` and `@gaunt-sloth/*` are published to a local
[Verdaccio](https://verdaccio.org) registry at `http://localhost:4873` for
development against unpublished versions. A gitignored `.npmrc` at the repo
root scopes those packages to localhost:

```
@gaunt-sloth:registry=http://localhost:4873
@galvanized-pukeko:registry=http://localhost:4873
```

Iteration on `vue-ui`:

```bash
cd packages/galvanized-pukeko-vue-ui
npm version patch --no-git-tag-version
npm run build
npm publish --registry http://localhost:4873
```

Then bump the consumer's `@galvanized-pukeko/vue-ui` pin and reinstall.

Container/auth setup is documented in
`gaunt-sloth-assistant/CONTRIBUTING.md` (section "Local Development Registry").
The same Verdaccio instance and `~/.npmrc` token serve both scopes.

### Start Verdaccio

First-time start (preserves the container across restarts):

```bash
docker run -d --name verdaccio -p 4873:4873 -v verdaccio-storage:/verdaccio/storage verdaccio/verdaccio
```

If a `verdaccio` container already exists (you'll see
`Conflict. The container name "/verdaccio" is already in use`),
just start it:

```bash
docker start verdaccio
```
