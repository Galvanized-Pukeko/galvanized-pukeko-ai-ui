# AG-UI for the Gaunt Sloth to talk to Galvanized Pukeko

## Goal

The goal is to introduce AG-UI to both Gaunt Sloth and Galvanized Pukeko to allow them to talk to each other using standard protocol AG-UI.

## References

- ADK-Java agent (back-end) `./packages/galvanized-pukeko-agent-adk`
- Vue UI source `./packages/galvanized-pukeko-vue-ui`
- Web client host `./packages/galvanized-pukeko-web-client`
- CLI Chat command of Gaunt Sloth `./packages/gaunt-sloth-assistant/src/commands/chatCommand.ts`
- Gaunt Sloth configuration `./packages/gaunt-sloth-assistant/src/config.ts`

### Package relationships

- `galvanized-pukeko-vue-ui` is the Vue source; it is compiled and deployed into `galvanized-pukeko-web-client`
- `galvanized-pukeko-web-client` hosts the built UI, owns `config.json`, and contains Playwright e2e tests
- `galvanized-pukeko-agent-adk` is the Java Spring Boot backend; it currently serves `config.json` at `/config.json`

### Read only copies
- ADK Java `./_readonly/adk-java`
- AG-UI typescript SDK `./_readonly/ag-ui/sdks/typescript` (on npm as `@ag-ui/core`, `@ag-ui/client`, `@ag-ui/encoder`, etc.)
- AG-UI Java community SDK `./_readonly/ag-ui/sdks/community/java`
  - Spring server library `./_readonly/ag-ui/sdks/community/java/servers/spring` — provides `AgUiService` and `AgUiAutoConfiguration`; copy into ADK project with explicit comment that it is a temporary copy pending Maven publication
- LangChain JS `./_readonly/langchainjs`
- LangGraph JS `./_readonly/langgraphjs`

## Technical Details

- Current OS is Arch Linux.
- AG-UI Java library is not yet published to Maven. Copy required source files from `./_readonly/ag-ui/sdks/community/java/` into the ADK project, placing an explicit comment on each copied file: `// Temporary copy from _readonly/ag-ui/sdks/community/java — remove when published to Maven`.
- In the case you need to create helper scripts, prefer NodeJS over Bash.
- Use workspaces to introduce package commands to root package.json.
- In the case you need to run maven builds — use local wrapper `./mvnw` of `packages/galvanized-pukeko-agent-adk`, global maven is not available.
- Use both sonatype central search and maven central search in the case you need to search for maven repositories.

## Criteria

- Existing user-facing functionality should not be affected (to be confirmed with integration tests)
- Existing Gaunt Sloth configuration should remain supported
- AG-UI should be introduced for communication between `./packages/galvanized-pukeko-agent-adk` and `./packages/galvanized-pukeko-web-client`
- A new command `api` should be introduced to Gaunt Sloth: `gaunt-sloth api ag-ui` starts an AG-UI HTTP server. In development environment use `npx gaunt-sloth api ag-ui`; use `npx gaunt-sloth api ag-ui -w packages/gaunt-sloth-assistant` to add it to the root repository package.json
- It should be possible to chat to Gaunt Sloth from Galvanized Pukeko UI; communication should go via AG-UI
- Existing `run_sse` communication between `galvanized-pukeko-agent-adk` and `galvanized-pukeko-web-client` should be replaced with AG-UI; the `run_sse` endpoint may be removed entirely — no deprecation needed
- No deprecations are necessary; functionality may be removed as long as functionality covered by integration tests remains unchanged

## Gaunt Sloth `api` command — port configuration

Add an `api` sub-key to the `commands` section of `GthConfig` (following the same pattern as `pr`, `review`, `chat`, etc.):

```json
{
  "commands": {
    "api": {
      "port": 3000
    }
  }
}
```

Default port is `3000`. The port may be overridden in the user's `.gsloth.config.json`.

## Web client `config.json` bootstrapping

`galvanized-pukeko-web-client` currently holds `config.json` with:
```json
{ "configUrl": "http://localhost:8080/config.json" }
```
This points to the ADK backend which serves the full config.

When the web client is connecting to Gaunt Sloth instead of ADK, Gaunt Sloth cannot be expected to serve `config.json`. Solution:

- Keep the existing `config.json` mechanism for ADK deployments (ADK continues to serve `/config.json`)
- For the Gaunt Sloth dev mode, embed the necessary configuration values at Vite build time (e.g. via `vite.config.ts` `define` or a separate `.env` file / build target), so the web client does not need to fetch `config.json` from the Gaunt Sloth host

## Java AG-UI controller

Replace the existing `ExecutionController` (based on the prebuilt ADK `ExecutionController`) with a new Spring `@RestController` that:

1. Copies (with temporary-copy comment) the required classes from `./_readonly/ag-ui/sdks/community/java/servers/spring/` into the ADK project
2. Uses `AgUiService.runAgent(agent, agUiParameters)` to execute the agent and return the `SseEmitter`
3. Exposes a `POST /agents/{agentId}/run` endpoint (or equivalent AG-UI standard path)
4. Removes all `run_sse` related endpoints and code

`AgUiAutoConfiguration` from the community SDK may be adapted for auto-wiring; review whether it fits the ADK project's Spring Boot setup.

## Tasks

- Before starting any work delegate to run integration tests on both projects to register that they all pass: `npm run it-adk` and `npm run it-gth`
- Update `galvanized-pukeko-agent-adk` ADK-Java dependency from current version (0.4.0) to latest available in Maven (0.7.0)
- Confirm `npm run it-adk` passes; iterate to fix if necessary
- Refactor `galvanized-pukeko-agent-adk` to serve AG-UI:
  - Copy required source from `./_readonly/ag-ui/sdks/community/java/servers/spring/` into the project with temporary-copy comments
  - Create a new `@RestController` using `AgUiService` to expose the AG-UI endpoint
  - Remove the `ExecutionController` and all `run_sse` code
- Refactor `galvanized-pukeko-vue-ui` and `galvanized-pukeko-web-client` to communicate via AG-UI only (remove `run_sse` client code)
- Add a separate Vite build target / config for Gaunt Sloth mode that embeds the AG-UI endpoint without requiring `config.json` from the server
- Confirm `npm run it-adk` passes; iterate to fix if necessary
- Implement new `api` command in Gaunt Sloth using `@ag-ui` typescript SDK (see `./_readonly/ag-ui/sdks/typescript`):
  - Add `api` to `GthConfig.commands` with a `port` field (default `3000`)
  - Command `gaunt-sloth api ag-ui` starts the AG-UI HTTP server on the configured port
- Create separate integration test `it-gth-ag-ui.js`:
  - Starts Gaunt Sloth in `api ag-ui` mode and the web client pointed at Gaunt Sloth
  - Test scenarios mirror the simple chat tests in `e2e/chat.spec.ts` (send via button, send via Enter key) — forms and charts are out of scope
  - Add `it-gth-ag-ui` script to root `package.json`
- In `./examples` create `examples/pukeko-gaunt-sloth-ag-ui/`:
  - Follow the pattern of `examples/adk-ui-agent-to-adk-agent/` (README, `start-all.sh` / Node startup script, necessary config)
  - Include a ready-to-run Gaunt Sloth configuration that backs the Galvanized Pukeko web client via AG-UI
  - README should explain how to start the demo
- Update and fix all unit tests in both Gaunt Sloth and Galvanized Pukeko repositories (run with `npm run test-gth`)
- Run all integration tests to confirm critical existing functionality is still OK; iterate to fix if necessary

## Out of scope

We do not expect Gaunt Sloth to render custom forms and charts. This is the next phase.
