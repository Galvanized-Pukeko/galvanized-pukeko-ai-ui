# ADK UI Agent to External MCP

Make sure your HTTP MCP is running on port 8081.

Start the UI client.

```bash
mvn clean compile exec:java -Dexec.classpathScope=compile -Dexec.args="--adk.agents.source-dir=target"
```