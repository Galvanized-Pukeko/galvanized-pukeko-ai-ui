import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createHttpServer } from 'http';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import { log, error } from './utils/console.js';

export interface WebSocketServerManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcastToClients: (message: any) => void;
  cleanup: () => Promise<void>;
}

export const createWebSocketServer = (port: number = 3001): WebSocketServerManager => {
  log('Setting up WebSocket server...');

  const httpServer = createHttpServer();
  const wss = new WebSocketServer({ server: httpServer });
  const connectedClients = new Set<WebSocket>();

  let mcpServer: Server | undefined;

  // Set the MCP server reference (will be called from main server)
  const setMcpServer = (server: Server) => {
    mcpServer = server;
  };

  wss.on('connection', (ws: WebSocket) => {
    log('Client connected to WebSocket');
    connectedClients.add(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        log('Received message from client:', message);

        if (message.type === 'cancel') {
          log(`Form cancelled at ${new Date(message.timestamp).toISOString()}`);

          if (mcpServer) {
            // this crashes
            log(mcpServer);
            // mcpServer.ping().then(r => {
            //   log('ping response', r);
            // }).catch(reason => {log('ping failed', reason)});
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
              log('response from client', r);
            }).catch((reason) => {
              log('failed to send message', reason)
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
            //   log('response from client', r);
            // })
          }
        } else if (message.type === 'form_submit') {
          log(`Form submitted at ${new Date(message.timestamp).toISOString()}`);
          log('Form data:', message.data);

          if (mcpServer) {
            mcpServer.request({
              method: "form_submit",
              params: {
                data: message.data,
                timestamp: message.timestamp
              },
            }, z.object({
              ack: z.boolean(),
              received: z.boolean().optional()
            })).then((r) => {
              log('form submission response from client', r);
            }).catch((reason) => {
              log('failed to send form submission', reason)
            });
          }
        }
      } catch (error) {
        error('Error parsing message from client:', error);
      }
    });

    ws.on('close', () => {
      log('Client disconnected from WebSocket');
      connectedClients.delete(ws);
    });

    ws.on('error', (err) => {
      error('WebSocket error:', err);
      connectedClients.delete(ws);
    });
  });

  httpServer.listen(port, () => {
    log(`WebSocket server running on ws://localhost:${port}`);
  });

  // Handle server errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      error(`Port ${port} is already in use. Please close any existing processes using this port.`);
    } else {
      error('HTTP server error:', err);
    }
    cleanup().catch((cleanupErr) => {
      error('Failed to cleanup after server error:', cleanupErr);
    });
  });

  // Handle process termination signals for graceful shutdown
  const handleExit = () => {
    log('Received exit signal, cleaning up WebSocket server...');
    cleanup().then(() => {
      log('WebSocket server cleanup completed');
    }).catch((err) => {
      error('Error during WebSocket server cleanup:', err);
    });
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
  process.on('uncaughtException', (err) => {
    error('Uncaught exception, cleaning up WebSocket server:', err);
    cleanup().then(() => {
      process.exit(1);
    }).catch(() => {
      process.exit(1);
    });
  });
  process.on('unhandledRejection', (reason) => {
    error('Unhandled rejection, cleaning up WebSocket server:', reason);
    cleanup().then(() => {
      process.exit(1);
    }).catch(() => {
      process.exit(1);
    });
  });

  // Function to broadcast messages to all connected clients
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastToClients = (message: any) => {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  };

  const cleanup = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          error('Cleanup timeout - forcing exit');
          resolve();
        }
      }, 5000); // 5 second timeout

      try {
        // Close all WebSocket connections
        connectedClients.forEach((client) => {
          try {
            if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
              client.terminate(); // Use terminate() for immediate close
            }
          } catch (err) {
            error('Error closing WebSocket client:', err);
          }
        });
        connectedClients.clear();

        // Close the WebSocket server
        wss.close((err) => {
          if (err) {
            error('Error closing WebSocket server:', err);
          } else {
            log('WebSocket server closed');
          }

          // Close the HTTP server
          httpServer.close((err) => {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              if (err) {
                error('Error closing HTTP server:', err);
                reject(err);
              } else {
                log('HTTP server closed');
                resolve();
              }
            }
          });
        });
      } catch (err) {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          error('Error during cleanup:', err);
          reject(err);
        }
      }
    });
  };

  return {
    broadcastToClients,
    cleanup,
    // Internal method to set MCP server reference
    setMcpServer
  } as WebSocketServerManager & { setMcpServer: (server: Server) => void };
};
