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
const SimpleUIComponentSchema = z.object({
  label: z.string().describe("Component label"),
});

enum ToolName {
  ECHO = "echo",
  PK_BUTTON = "pk_button",
  PK_CHECKBOX = "pk_checkbox",
  PK_FORM = "pk_form",
  PK_INPUT = "pk_input",
  PK_RADIO = "pk_radio",
  PK_SELECT = "pk_select",
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

  // Set up update interval for random log messages
  const logsUpdateInterval = setInterval(() => {
    const message = {
      method: "notifications/message",
      params: messages[Math.floor(Math.random() * messages.length)],
    };
    if (!isMessageIgnored(message.params.level as LoggingLevel))
      server.notification(message);
  }, 20000);

  // Set up update interval for stderr messages
  const stdErrUpdateInterval = setInterval(() => {
    const shortTimestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    server.notification({
      method: "notifications/stderr",
      params: { content: `${shortTimestamp}: A stderr message` },
    });
  }, 30000);

 server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: ToolName.ECHO,
        description: "Echoes back the input",
        inputSchema: zodToJsonSchema(SimpleUIComponentSchema) as ToolInput,
      },
      {
        name: ToolName.PK_BUTTON,
        description: "Renders a clickable button element with customizable text and styling",
        inputSchema: zodToJsonSchema(SimpleUIComponentSchema) as ToolInput,
      },
      {
        name: ToolName.PK_CHECKBOX,
        description: "Renders a checkbox input that allows users to select or deselect an option",
        inputSchema: zodToJsonSchema(SimpleUIComponentSchema) as ToolInput,
      },
      {
        name: ToolName.PK_FORM,
        description: "Renders a form container that can hold multiple input fields and a submit button",
        inputSchema: zodToJsonSchema(SimpleUIComponentSchema) as ToolInput,
      },
      {
        name: ToolName.PK_INPUT,
        description: "Renders an input field into which user can input plain text value or number",
        inputSchema: zodToJsonSchema(SimpleUIComponentSchema) as ToolInput,
      },
      {
        name: ToolName.PK_RADIO,
        description: "Renders a group of radio buttons where only one option can be selected at a time",
        inputSchema: zodToJsonSchema(SimpleUIComponentSchema) as ToolInput,
      },
      {
        name: ToolName.PK_SELECT,
        description: "Renders a dropdown select element that allows users to choose one option from a list",
        inputSchema: zodToJsonSchema(SimpleUIComponentSchema) as ToolInput,
      }
    ];

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const { label } = SimpleUIComponentSchema.parse(args);

    // Derive type from tool name (remove pk_ prefix if present and convert to lowercase)
    const type = name.replace('pk_', '').toLowerCase();

    broadcastToClients({
      type: 'form',
      components: [{ type, label }]
    });

    return {
      content: [{ type: "text", text: `${type} component sent successfully` }],
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
