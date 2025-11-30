#!/bin/bash

# Start all services for the adk-ui-agent-to-external-mcp example
# Usage: ./start-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting demo-mcp server on port 3007..."
cd "$SCRIPT_DIR/demo-mcp"
npm run dev &
MCP_PID=$!

# Wait a bit for MCP server to start
sleep 2

echo "Starting demo-ui-agent on port 8080..."
cd "$SCRIPT_DIR/demo-ui-agent"
./mvnw clean compile exec:java -Dexec.classpathScope=compile -Dexec.args="--adk.agents.source-dir=target" &
UI_AGENT_PID=$!

echo ""
echo "Both services starting..."
echo "  demo-mcp (port 3007): PID $MCP_PID"
echo "  demo-ui-agent (port 8080): PID $UI_AGENT_PID"
echo ""
echo "Open http://localhost:8080 in your browser"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C and kill both processes
trap "echo 'Stopping services...'; kill $MCP_PID $UI_AGENT_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for both processes
wait
