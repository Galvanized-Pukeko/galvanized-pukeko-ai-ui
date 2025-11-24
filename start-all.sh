#!/bin/bash

# Function to kill all background jobs on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p)
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo "Starting UI Server ADK..."
cd packages/ui-server-adk
mvn clean compile exec:java -Dexec.classpathScope=compile -Dexec.args="--server.port=8080 --adk.agents.source-dir=target" &
ADK_PID=$!
cd ../..

echo "Starting Web UI..."
cd packages/web
npm run dev &
WEB_PID=$!
cd ../..

echo "Both services started. Press Ctrl+C to stop."
wait
