# Pukeko + Gaunt Sloth AG-UI Example

This example demonstrates the Galvanized Pukeko web client communicating with Gaunt Sloth via the AG-UI protocol.

## Prerequisites

- Node.js 24+
- npm 11+
- A configured Gaunt Sloth config (`.gsloth.config.json`) with a valid LLM provider

## Quick Start

From this directory:

```bash
node start.js
```

This will:
1. Start Gaunt Sloth in AG-UI server mode, on port 3000 by default
2. Start the Galvanized Pukeko web client, on port 5555 by default (pointed at Gaunt Sloth)
3. Open your browser to http://localhost:5555

Both ports come from the repository-root `.env` when there is one; see [Ports](#ports) below.

Press `Ctrl+C` to stop all services.

## Manual Start

Start each service in separate terminals:

**Terminal 1 — Gaunt Sloth AG-UI server:**

This example has no `node_modules` of its own; Gaunt Sloth comes from the repository
root. Run its installed binary directly, from this directory:

```bash
../../node_modules/.bin/gaunt-sloth-api ag-ui
```

**Terminal 2 — Web client (with AG-UI URL):**
```bash
cd ../../packages/galvanized-pukeko-web-client
AGUI_URL=http://localhost:3000/agents/default/run npm run dev
```

Then open http://localhost:5555 in your browser.

## Configuration

The example uses the Gaunt Sloth config from this directory (`.gsloth.config.json`). Edit this file to change the LLM provider or model.

The example ships with an OpenAI configuration. Set `OPENAI_API_KEY` in your environment or update `.gsloth.config.json` for a different provider.

### Ports

`start.js` reads the repository-root `.env` and takes the AG-UI port from `GTH_AGUI_PORT` and the
web client's port from `WEB_PORT`, falling back to 3000 and 5555 when the file or the variable is
absent. It passes the resolved port to `gaunt-sloth-api` as `--port`, which wins over the
`commands.api.port` in `.gsloth.config.json`; `--config` names the configuration file outright, so a
missing one ends the run instead of falling back to whatever the working directory happens to hold.

Setting `GTH_AGUI_PORT` is how you move the AG-UI server off port 3000 — editing
`commands.api.port` alone will not, because the flag outranks it.

**`WEB_PORT` moves the web client, but the demo does not yet work anywhere but 5555.**
`.gsloth.config.json` pins `cors.allowOrigin` to `http://localhost:5555`, and `gaunt-sloth-api`
exposes no flag or environment override for it. Measured: a preflight sent from
`Origin: http://localhost:6555` still comes back with `Access-Control-Allow-Origin:
http://localhost:5555`, so the browser blocks every chat request. Moving `WEB_PORT` therefore
relocates the client and breaks it, rather than moving the example. Tracked as OPS-16 (dynamic CORS
origin for the AG-UI server), which needs a change in gaunt-sloth as well as here.

## How It Works

```
┌────────────────┐          AG-UI (SSE)          ┌──────────────┐
│  Pukeko Web    │◄──────────────────────────────►│ Gaunt Sloth  │
│  Client :5555  │  POST /agents/{agentId}/run    │  API :3000   │
└────────────────┘                                └──────────────┘
                                            │
                                            ▼
                                      ┌──────────┐
                                      │  LLM API │
                                      └──────────┘
```

- The web client sends chat messages as AG-UI `RunAgentInput` POST requests
- Gaunt Sloth processes them through LangChain/LangGraph and streams AG-UI events back
- Events: `RUN_STARTED → TEXT_MESSAGE_START → TEXT_MESSAGE_CONTENT* → TEXT_MESSAGE_END → RUN_FINISHED`

## Related

- [Gaunt Sloth Assistant](https://github.com/pukeko-robotics/gaunt-sloth)
- [Galvanized Pukeko Web Client](../../packages/galvanized-pukeko-web-client/README.md)
