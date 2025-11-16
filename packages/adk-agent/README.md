# Java ADK agent

(Used Maven 3.9.11 and Temurin JDK 25)

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
