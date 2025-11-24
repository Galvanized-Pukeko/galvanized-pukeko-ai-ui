# Java ADK UI agent

## Using locally

Start the server:
```bash
mvn clean compile exec:java -Dexec.classpathScope=compile -Dexec.args="--server.port=8080 --adk.agents.source-dir=target"
```
(Not sure if -Dexec.mainClass=io.github.galvanized_pukeko.UiAgentApplication is actually needed)

Create a new session:
```bash
'http://localhost:8080/apps/ui-agent/users/user/sessions' \              
-X 'POST' \
-H "Content-Type: application/json" \
-H 'Accept: application/json, text/plain, */*'
```

Returns JSON like this
```json
{"id":"0c6cbd90-c832-43bc-accd-f47bf78d1cf7","appName":"ui-agent","userId":"user","state":{},"events":[],"lastUpdateTime":1.763716899419022E9}
```

Session ID can now be reused to call other endpoints,

for example:
```bash
curl 'http://localhost:8080/run_sse' \
  -H 'Accept: text/event-stream' \
  -H 'Accept-Language: en-AU,en-GB;q=0.9,en;q=0.8,en-US;q=0.7' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  --data-raw '{"appName":"ui-agent","userId":"user","sessionId":"0c6cbd90-c832-43bc-accd-f47bf78d1cf7","newMessage":{"role":"user","parts":[{"text":"How are you today?"}]},"streaming":false,"stateDelta":null}'
```

Returns JSON like this:
```json
{"id":"bac4f660-074c-43c4-865d-f650507477a5","invocationId":"e-e13cc145-d84d-4bfc-8268-bb2480b81c51","author":"ui-agent","content":{"parts":[{"text":"As an AI, I don't experience \"days\" or have feelings in the way humans do, but I'm ready and functioning perfectly!\n\nHow can I help you today?"}],"role":"model"},"actions":{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{}},"timestamp":1763717198184}
```

## Stopping the server

In the case you have a server dangling and occupying the port:

```bash
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
```
