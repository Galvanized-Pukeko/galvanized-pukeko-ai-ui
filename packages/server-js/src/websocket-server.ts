import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createHttpServer } from 'http';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";

export interface WebSocketServerManager {
  broadcastToClients: (message: any) => void;
  cleanup: () => Promise<void>;
}

export const createWebSocketServer = (port: number = 3001): WebSocketServerManager => {
  console.log('Setting up WebSocket server...');
  
  const httpServer = createHttpServer();
  const wss = new WebSocketServer({ server: httpServer });
  const connectedClients = new Set<WebSocket>();
  
  let mcpServer: Server | undefined;

  // Set the MCP server reference (will be called from main server)
  const setMcpServer = (server: Server) => {
    mcpServer = server;
  };

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    connectedClients.add(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message from client:', message);

        if (message.type === 'cancel') {
          console.log(`Form cancelled at ${new Date(message.timestamp).toISOString()}`);
          
          if (mcpServer) {
            // this crashes
            console.log(mcpServer);
            // mcpServer.ping().then(r => {
            //   console.log('ping response', r);
            // }).catch(reason => {console.log('ping failed', reason)});
            mcpServer.request({
              method: "message",
              params: {
                level: "info",
                logger: "test-server",
                data: `Form cancelled at ${new Date(message.timestamp).toISOString()}`,
              },
            }, z.object({
              ack: z.boolean()
            })).then((r) => {
              console.log('response from client', r);
            }).catch((reason) => {
              console.log('failed to send message', reason)
              // failed to send message McpError: MCP error -32601: Method not found
              // This should somehow be handled in the client
            });

            // This goes somewhere
            // mcpServer.notification({
            //   method: "notifications/message",
            //   params: {
            //     message: "Form cancelled at " + new Date(message.timestamp).toISOString(),
            //   }
            // }).then((r) => {
            //   console.log('response from client', r);
            // })
          }
        }
      } catch (error) {
        console.error('Error parsing message from client:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  httpServer.listen(port, () => {
    console.log(`WebSocket server running on ws://localhost:${port}`);
  });

  // Function to broadcast messages to all connected clients
  const broadcastToClients = (message: any) => {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  };

  const cleanup = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Close all WebSocket connections
      connectedClients.forEach((client) => {
        client.close();
      });

      // Close the WebSocket server
      wss.close(() => {
        console.log('WebSocket server closed');
        
        // Close the HTTP server
        httpServer.close(() => {
          console.log('HTTP server closed');
          resolve();
        });
      });
    });
  };

  return {
    broadcastToClients,
    cleanup,
    // Internal method to set MCP server reference
    setMcpServer
  } as WebSocketServerManager & { setMcpServer: (server: Server) => void };
};