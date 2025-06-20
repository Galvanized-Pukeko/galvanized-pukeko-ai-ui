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
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createHttpServer } from 'http';

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

/* Input schemas for tools implemented in this server */

const ComponentSchema = z.object({
  type: z.enum(['button', 'checkbox', 'input', 'radio', 'select']).describe("Component type"),
  label: z.string().describe("Component label"),
});

const FormSchema = z.object({
  components: z.array(ComponentSchema).describe("Array of form components"),
});

enum ToolName {
  PK_FORM = "pk_form",
}

// Set up WebSocket server (dirty stuff, doing it on file load)
console.log('Setting up WebSocket server...');
const WS_PORT = 3001;
const httpServer = createHttpServer();
const wss = new WebSocketServer({ server: httpServer });
const connectedClients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to WebSocket');
  connectedClients.add(ws);

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
        resources: { subscribe: false },
        tools: {},
        logging: {},
        completions: {},
      },
    }
  );

  let logLevel: LoggingLevel = "debug";
  const messages = [
    { level: "debug", data: "Debug-level message" },
    { level: "info", data: "Info-level message" },
    { level: "notice", data: "Notice-level message" },
    { level: "warning", data: "Warning-level message" },
    { level: "error", data: "Error-level message" },
    { level: "critical", data: "Critical-level message" },
    { level: "alert", data: "Alert level-message" },
    { level: "emergency", data: "Emergency-level message" },
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

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name !== ToolName.PK_FORM) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const { components } = FormSchema.parse(args);

    broadcastToClients({
      type: 'form',
      components: components
    });

    return {
      content: [{ type: "text", text: `Form with ${components.length} component(s) sent successfully` }],
    };
  });


  server.setRequestHandler(SetLevelRequestSchema, async (request) => {
    const { level } = request.params;
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

  return { server, cleanup };
};
