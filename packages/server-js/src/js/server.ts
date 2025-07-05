import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  LoggingLevel,
  SetLevelRequestSchema,
  Tool,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {z} from "zod";
import {zodToJsonSchema} from "zod-to-json-schema";
import {WebSocketServer, WebSocket} from 'ws';
import {createServer as createHttpServer} from 'http';

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const serverContext = {
  mcpServer: undefined as Server,
  webSocketServer: undefined as WebSocketServer,
}

/* Input schemas for tools implemented in this server */
// let componentsConfig = z.enum(['input', 'checkbox', 'radio', 'select', 'button']);
const componentsConfig = z.enum(['input', 'checkbox', 'select']);

const ComponentSchema = z.object({
  type: componentsConfig.describe("Component type"),
  label: z.string().describe("Component label (should be unique for each component)").optional(),
  options: z.array(
    z.string()).describe("Component options (only applicable to select)"
  ).optional(),
  value: z.string().describe("Predefined input value").optional()
});

const FormSchema = z.object({
  components: z.array(ComponentSchema).describe("Array of form components"),
  submitLabel: z.string().describe("Submit button label").optional(),
  cancelLabel: z.string().describe("Cancel button label").optional(),
});

enum ToolName {
  PK_FORM = "pk_form",
}

// Set up WebSocket server (dirty stuff, doing it on file load)
console.log('Setting up WebSocket server...');
const WS_PORT = 3001;
const httpServer = createHttpServer();
const wss = new WebSocketServer({server: httpServer});
serverContext.webSocketServer = wss;
const connectedClients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to WebSocket');
  connectedClients.add(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message from client:', message);

      if (message.type === 'cancel') {
        console.log(`Form cancelled at ${new Date(message.timestamp).toISOString()}`);
        // this crashes
        serverContext.mcpServer.request({
          method: "notifications/message",
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
        // serverContext.mcpServer.notification({
        //   method: "notifications/message",
        //   params: {
        //     message: "Form cancelled at " + new Date(message.timestamp).toISOString(),
        //   }
        // }).then((r) => {
        //   console.log('response from client', r);
        // })
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

httpServer.listen(WS_PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
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

export const createServer = () => {
  const server = new Server(
    {
      name: "galvanized-pukeko",
      version: "0.0.1",
    },
    {
      capabilities: {
        prompts: {},
        resources: {subscribe: false},
        tools: {},
        logging: {},
        completions: {},
      },
    }
  );
  serverContext.mcpServer = server;

  let logLevel: LoggingLevel = "debug";
  const messages = [
    {level: "debug", data: "Debug-level message"},
    {level: "info", data: "Info-level message"},
    {level: "notice", data: "Notice-level message"},
    {level: "warning", data: "Warning-level message"},
    {level: "error", data: "Error-level message"},
    {level: "critical", data: "Critical-level message"},
    {level: "alert", data: "Alert level-message"},
    {level: "emergency", data: "Emergency-level message"},
  ];

  const isMessageIgnored = (level: LoggingLevel): boolean => {
    const currentLevel = messages.findIndex((msg) => logLevel === msg.level);
    const messageLevel = messages.findIndex((msg) => level === msg.level);
    return messageLevel < currentLevel;
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: ToolName.PK_FORM,
        description: "Renders a form with multiple components (button, checkbox, input, radio, select)",
        inputSchema: zodToJsonSchema(FormSchema) as ToolInput,
      }
    ];

    return {tools};
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {name, arguments: args} = request.params;

    if (name !== ToolName.PK_FORM) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const {components, submitLabel, cancelLabel} = FormSchema.parse(args);

    broadcastToClients({
      type: 'form',
      components: components,
      submitLabel: submitLabel,
      cancelLabel: cancelLabel
    });

    return {
      content: [{
        type: "text",
        text: `Form with ${components.length} component(s) sent successfully`
      }],
    };
  });


  server.setRequestHandler(SetLevelRequestSchema, async (request) => {
    const {level} = request.params;
    logLevel = level;

    // Demonstrate different log levels
    await server.notification({
      method: "notifications/message",
      params: {
        level: "debug",
        logger: "test-server",
        data: `Logging level set to: ${logLevel}`,
      },
    });

    return {};
  });

  const cleanup = async () => {
    // Close all WebSocket connections
    connectedClients.forEach((client) => {
      client.close();
    });

    // Close the WebSocket server
    wss.close(() => {
      console.log('WebSocket server closed');
    });

    // Close the HTTP server
    httpServer.close(() => {
      console.log('HTTP server closed');
    });
  };

  return {server, cleanup};
};
