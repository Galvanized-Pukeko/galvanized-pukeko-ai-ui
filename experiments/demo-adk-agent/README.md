# Java ADK agent

(Used Maven 3.9.11 and Temurin JDK 17)

## Model Configuration

The agent supports both Gemini and Anthropic Claude models via Vertex AI. Configuration is done in `src/main/resources/application.properties`:

```properties
# Choose provider: 'gemini' or 'anthropic'
model.provider=gemini

# Gemini model name
model.gemini.name=gemini-2.5-flash

# Anthropic model name (available: claude-sonnet-4-5@20250929, claude-3-sonnet@20240229, claude-3-haiku@20240307)
model.anthropic.name=claude-sonnet-4-5@20250929
```

### Using Anthropic Claude

To use Anthropic Claude via Vertex AI, you need to:

1. Set `model.provider=anthropic` in `application.properties`
2. Set the following environment variables (automatically configured in `deploy.sh` for Cloud Run):
   - `GOOGLE_CLOUD_PROJECT` - Your GCP project ID
   - `GOOGLE_CLOUD_LOCATION` - The Vertex AI region (e.g., `global`)

For local development:
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="global"
```

**Note:** The Anthropic SDK is included as a transitive dependency from `google-adk`. The following dependencies have been added to support Anthropic:
- `jackson-module-kotlin` - Required by the Anthropic SDK
- Jackson BOM (`jackson-bom`) - Ensures all Jackson components use version 2.18.2 to avoid compatibility issues

## Running locally

Start server
```bash
mvn compile exec:java -Dexec.mainClass=com.google.adk.web.AdkWebServer -Dexec.classpathScope=compile -Dexec.args="--server.port=8080 --adk.agents.source-dir=target"
```

Create new session:
```bash
curl 'http://localhost:8080/apps/hello-time-agent/users/user/sessions/test_session1' \
  -X 'POST' \
  -H "Content-Type: application/json" \
  -H 'Accept: application/json, text/plain, */*'
```

The session post should produce a session ID, which should be used in messaging

```bash
curl 'http://localhost:8080/run_sse' \
  -H 'Accept: text/event-stream' \
  -H 'Accept-Language: en-AU,en-GB;q=0.9,en;q=0.8,en-US;q=0.7' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  --data-raw '{"appName":"hello-time-agent","userId":"user","sessionId":"test_session1","newMessage":{"role":"user","parts":[{"text":"what is the time in Paris?"}]},"streaming":false,"stateDelta":null}'
  ```

## Running on Cloud Run

## Deploy

Deploy the container to Cloud Run (the `deploy.sh` script wraps the `gcloud run deploy` command that targets the `global` region and sets the required env vars).

First you need to define your GCP project name.

```bash
export TEST_AGENT_GCP_PROJECT="{your-gcp-project-name}"
export TEST_AGENT_HOST="{your-service-hostname}" # e.g. test-agent-service-abc123-ue.a.run.app
sh deploy.sh
```

Grab the service URL from the deploy command and keep it in an environment variable for the curl commands below.
```bash
export APP_URL="https://YOUR-SERVICE-URL.a.run.app"
```
If you're using the default Cloud Run URL, set `TEST_AGENT_HOST` to the hostname portion of `APP_URL` (without `https://`).

Create a session on the hosted service.
(normally post goes to /apps/hello-time-agent/users/user1/sessions/ and creates a new UUID, but for testing we can always create the same ID)
```bash
curl -X POST \
  "$APP_URL/apps/hello-time-agent/users/user1/sessions/test_session_1" \
  -H "Content-Type: application/json" \
  -H 'Accept: application/json, text/plain, */*'
```

Send a message to the deployed agent by hitting the `run_sse` endpoint (replace the `sessionId` with the value returned by the session creation call).
```bash
curl "$APP_URL/run_sse" \
  -H 'Accept: text/event-stream' \
  -H 'Accept-Language: en-AU,en-GB;q=0.9,en;q=0.8,en-US;q=0.7' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  --data-raw '{"appName":"hello-time-agent","userId":"user1","sessionId":"test_session_1","newMessage":{"role":"user","parts":[{"text":"what is the time in Paris?"}]},"streaming":false,"stateDelta":null}'
```
