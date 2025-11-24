# Integrate tools

Modify server/src/js/server.ts so that it imports server/src/js/random-server.ts
and whenever the appropriate tool is called, it should send the appropriate message via WS.
The interval should be removed, as it was only added to verify the connection.

