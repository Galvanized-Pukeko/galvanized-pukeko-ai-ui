# ADK UI Agent to External MCP Example

This example demonstrates how to use `galvanized-pukeko-agent-adk` with an external MCP (Model Context Protocol) server. The UI agent connects to an HTTP-based MCP server to extend its capabilities with additional tools.

## Prerequisites

- Java 17+
- Maven 3.6+ (hopefully maven wrapper can do everything for you)
- Node.js 18+

## Running the Example

### Start Both Services

The easiest way to start both the MCP server and UI agent:

```bash
./start-all.sh
```

Or start them individually in separate terminals:

Start MCP server (`cd demo-mcp`)
```bash
npm install
npm run dev
```

Start UI agent (`cd demo-ui-agent`)
```bash
./mvnw clean compile exec:java -Dexec.classpathScope=compile -Dexec.args="--adk.agents.source-dir=target"
```

### Access the UI

Open your browser and navigate to:
```
http://localhost:8080
```

### Creating a Session and Sending a Message

Using curl:

```bash
# Create a session
curl 'http://localhost:8080/apps/ui-agent/users/user/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H 'Accept: application/json'

# Send a message (replace SESSION_ID with the id from the previous response)
curl 'http://localhost:8080/run_sse' \
  -H 'Accept: text/event-stream' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "appName": "ui-agent",
    "userId": "user",
    "sessionId": "SESSION_ID",
    "newMessage": {
      "role": "user",
      "parts": [{"text": "What tools do you have available?"}]
    },
    "streaming": false
  }'
```

## How It Works

### UI Agent

The `demo-ui-agent` is a minimal Spring Boot application that extends `UiAgentApplication` from the `galvanized-pukeko-agent-adk` library:

```java
public class DemoUiAgentApplication extends UiAgentApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoUiAgentApplication.class, args);
    }
}
```

This provides:
- Dynamic UI rendering tools (forms, charts, tables)
- WebSocket support for real-time updates
- Embedded web client
- MCP integration

### MCP Server

The `demo-mcp` is an HTTP-based MCP server built with Node.js. It exposes tools that the UI agent can discover and use. The UI agent connects to it via the configuration in `application.properties`:

```properties
mcp.enabled=true
mcp.url=http://localhost:3007
```

## Key Files

- [`demo-ui-agent/pom.xml`](demo-ui-agent/pom.xml) - Maven dependency on `galvanized-pukeko-agent-adk`
- [`demo-ui-agent/src/main/java/io/github/galvanized_pukeko/DemoUiAgentApplication.java`](demo-ui-agent/src/main/java/io/github/galvanized_pukeko/DemoUiAgentApplication.java) - Main application class
- [`demo-ui-agent/src/main/resources/application.properties`](demo-ui-agent/src/main/resources/application.properties) - MCP configuration
- [`demo-mcp/src/`](demo-mcp/src/) - MCP server implementation

## Stopping the Services

Press `Ctrl+C` in the terminal where `start-all.sh` is running, or:

```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:3007 | xargs kill -9
```

## Deploying to Google Cloud Run

The UI agent can be deployed to Google Cloud Run:

```bash
cd demo-ui-agent

# Set your GCP project
export TEST_AGENT_GCP_PROJECT=your-gcp-project-id

# Deploy
./deploy.sh
```

Prerequisites:
- Google Cloud CLI (`gcloud`) installed and authenticated
- A GCP project with Cloud Run and Vertex AI APIs enabled

The deployment script uses Vertex AI for model access, which supports both Gemini and Anthropic models from the Model Garden.

**Note:** When deploying to Cloud Run, ensure your MCP server is also accessible from the cloud environment, or update `application.properties` to point to a cloud-hosted MCP server.

## Related Documentation

- [galvanized-pukeko-agent-adk README](../../packages/galvanized-pukeko-agent-adk/README.md)
- [ADK UI Agent to ADK Agent Example](../adk-ui-agent-to-adk-agent/README.md)
- [Root README](../../README.md)
