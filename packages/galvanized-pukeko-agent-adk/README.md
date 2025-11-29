# Galvanized Pukeko Agent ADK

A Spring Boot application that extends the Google ADK (Agent Development Kit) to provide a UI-enabled agent with dynamic form rendering capabilities. The agent can interact with users through chat and render dynamic UI components including forms, charts, and tables.

## Features

- **Dynamic UI Rendering**: Render forms, charts, and tables dynamically through agent tools
- **WebSocket Integration**: Real-time communication for form updates
- **MCP Support**: Optional integration with Model Context Protocol servers
- **Embedded Web Client**: Serves the Vue.js web client from the same server
- **SSE Streaming**: Server-sent events for chat responses

## Architecture

This application extends `AdkWebServer` from the Google ADK framework and provides:

- **UiAgent**: An LLM-powered agent with tools for rendering UI components
- **FormWebSocketHandler**: WebSocket handler for real-time form communication
- **MCP Integration**: Optional toolset integration via Model Context Protocol

## Getting Started

### Prerequisites

- Java 17+
- (Optional) Node.js 18+ for web client development

### Running the Server

Start the server with:

```bash
./mvnw clean compile exec:java -Dexec.classpathScope=compile -Dexec.args="--server.port=8080 --adk.agents.source-dir=target"
```

The server will start on port 8080 and serve:
- Web UI at `http://localhost:8080/`
- Agent API endpoints at `/apps/pukeko-ui-agent/`
- WebSocket endpoint at `/ws`

### Configuration

Configuration is managed through `src/main/resources/application.properties`:

#### UI Configuration

```properties
pukeko.ui.base-url=http://localhost:8085
pukeko.ui.ws-url=ws://localhost:8085/ws
pukeko.ui.app-name=pukeko-ui-agent

# Optional: Configure logo, header, and footer items
pukeko.ui.logo.text=My App
pukeko.ui.logo.href=https://example.com
pukeko.ui.header[0].text=Docs
pukeko.ui.header[0].href=https://example.com/docs
pukeko.ui.footer[0].text=© 2025 My Company
```

#### CORS Configuration

```properties
adk.web.cors.origins=http://localhost:5555,https://localhost:5555
adk.web.cors.methods=GET,POST,PUT,DELETE,OPTIONS
adk.web.cors.headers=*
adk.web.cors.allow-credentials=true
```

#### MCP (Model Context Protocol) Configuration

Enable MCP to connect to external tool servers:

```properties
# Enable or disable MCP integration
mcp.enabled=true

# Full URL for MCP server (supports http://, https://, sse://, stdio://)
mcp.url=http://localhost:8081

# JWT token for authentication (optional)
mcp.jwt=${PUKEKO_MCP_JWT:}
```

For stdio transport:

```properties
mcp.url=stdio://npx
mcp.command=npx
mcp.args=-y,@modelcontextprotocol/server-everything
```

## Web Client Integration

The application serves a built Vue.js web client from `src/main/resources/browser/`. 

To update the web client:

1. Navigate to `packages/galvanized-pukeko-web-client`
2. Run the deployment script:

```bash
cd ../galvanized-pukeko-web-client
./deploy-to-adk.sh
```

This script will:
- Build the web client
- Copy the build artifacts to `src/main/resources/browser/`

## API Usage

### Creating a Session

```bash
curl 'http://localhost:8080/apps/pukeko-ui-agent/users/user/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H 'Accept: application/json'
```

Response:
```json
{
  "id": "0c6cbd90-c832-43bc-accd-f47bf78d1cf7",
  "appName": "pukeko-ui-agent",
  "userId": "user",
  "state": {},
  "events": [],
  "lastUpdateTime": 1763716899419022
}
```

### Sending a Message

```bash
curl 'http://localhost:8080/run_sse' \
  -H 'Accept: text/event-stream' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "appName": "pukeko-ui-agent",
    "userId": "user",
    "sessionId": "0c6cbd90-c832-43bc-accd-f47bf78d1cf7",
    "newMessage": {
      "role": "user",
      "parts": [{"text": "Show me a contact form"}]
    },
    "streaming": false
  }'
```

## Available Agent Tools

The UI Agent provides the following tools:

- **renderForm**: Render dynamic forms with various input components
- **renderChart**: Display charts (pie, bar, line, etc.)
- **renderTable**: Show tabular data

## Development

### Stopping the Server

If you need to kill a dangling server process:

```bash
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
```

## Related Documentation

- [Root README](../../README.md) - Overall project documentation
- [Web Client](../galvanized-pukeko-web-client/) - Vue.js web client source
