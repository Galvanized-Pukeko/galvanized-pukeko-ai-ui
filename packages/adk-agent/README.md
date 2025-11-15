# Java ADK agent

## Running locally

Start server
```bash
mvn exec:java -Dexec.mainClass=com.google.adk.web.AdkWebServer -Dexec.classpathScope=compile -Dexec.args="--server.port=8080 --adk.agents.source-dir=target"
```

Create new session:
```bash
curl 'http://localhost:8080/apps/hello-time-agent/users/user/sessions' \
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
  --data-raw '{"appName":"hello-time-agent","userId":"user","sessionId":"c4352550-5e3e-49d3-9f9f-fd0010e56bdd","newMessage":{"role":"user","parts":[{"text":"what is the time in Paris?"}]},"streaming":false,"stateDelta":null}'
  ```

## Running on Cloud Run

Deploy the container to Cloud Run (the `deploy.sh` script wraps the `gcloud run deploy` command that targets the `us-west1` region and sets the required env vars).

First you need to define your GCP project name.

```bash
export TEST_AGENT_GCP_PROJECT="{your-gcp-project-name}"
sh deploy.sh
```

Grab the service URL from the deploy command and keep it in an environment variable for the curl commands below.
```bash
export APP_URL="https://YOUR-SERVICE-URL.a.run.app"
```

Create a session on the hosted service.
```bash
curl -X POST \
  "$APP_URL/apps/hello-time-agent/users/user/sessions" \
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
  --data-raw '{"appName":"hello-time-agent","userId":"user","sessionId":"d6b5c314-078f-42be-b4d6-c66766f944e7","newMessage":{"role":"user","parts":[{"text":"what is the time in Paris?"}]},"streaming":false,"stateDelta":null}'
```

## Deploy

```bash
sh deploy.sh
```

```bash
# Save app URL
export APP_URL="https://test-agent-service-159166179683.us-west1.run.app"
# Create session
curl -X POST \
    $APP_URL/apps/capital_agent/users/user1/sessions \
    -H "Content-Type: application/json"
# Send a request to AGENT
curl -X POST \
    $APP_URL/run_sse \
    -H "Content-Type: application/json" \
    -d '{
    "appName": "hello-time-agent",
    "userId": "user1",
    "sessionId": "7cb4c37f-ced4-4b2d-9b6e-78f739099ac1",
    "newMessage": {
        "role": "user",
        "parts": [{
        "text": "What is the capital of Canada?"
        }]
    },
    "streaming": false
    }'
```
