#!/bin/bash

# Start MCP demo with all services including web client
# Usage: ./start-mcp-demo.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to kill all background jobs on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT SIGTERM

echo "Starting demo-mcp server on port 3007..."
cd "$SCRIPT_DIR/examples/adk-ui-agent-to-external-mcp/demo-mcp"
npm run dev &
MCP_PID=$!

# Wait a bit for MCP server to start
sleep 2

echo "Starting demo-ui-agent on port 8080..."
cd "$SCRIPT_DIR/examples/adk-ui-agent-to-external-mcp/demo-ui-agent"
./mvnw clean compile exec:java -Dexec.classpathScope=compile -Dexec.args="--adk.agents.source-dir=target --adk.web.cors.origins=http://localhost:8080,http://localhost:5555" &
UI_AGENT_PID=$!

echo "Starting Web Client on port 5555..."
cd "$SCRIPT_DIR/packages/galvanized-pukeko-web-client"
npm run dev -- --port 5555 &
WEB_PID=$!

echo ""
echo "All services starting..."
echo "  demo-mcp (port 3007): PID $MCP_PID"
echo "  demo-ui-agent (port 8080): PID $UI_AGENT_PID"
echo "  web-client (port 5555): PID $WEB_PID"
echo ""
echo "Open http://localhost:5555 in your browser"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait
