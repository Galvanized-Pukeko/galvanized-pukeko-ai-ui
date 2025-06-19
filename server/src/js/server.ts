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
const EchoSchema = z.object({
  message: z.string().describe("Message to echo"),
});

const PkButtonSchema = z.object({
  text: z.string().describe("Text to display on the button"),
  type: z.enum(["primary", "secondary", "danger"]).optional().describe("Button type/style"),
  disabled: z.boolean().optional().describe("Whether the button is disabled"),
});

const PkCheckboxSchema = z.object({
  label: z.string().describe("Label text for the checkbox"),
  checked: z.boolean().optional().describe("Whether the checkbox is checked"),
  disabled: z.boolean().optional().describe("Whether the checkbox is disabled"),
});

const PkFormSchema = z.object({
  fields: z.array(z.object({
    name: z.string().describe("Field name"),
    type: z.string().describe("Field type"),
  })).describe("Form fields configuration"),
  submitText: z.string().optional().describe("Submit button text"),
});

const PkInputSchema = z.object({
  placeholder: z.string().optional().describe("Placeholder text"),
  value: z.union([z.string(), z.number()]).optional().describe("Input value"),
  type: z.enum(["text", "number", "email", "password"]).optional().describe("Input type"),
  disabled: z.boolean().optional().describe("Whether the input is disabled"),
});

const PkRadioSchema = z.object({
  options: z.array(z.object({
    value: z.string().describe("Option value"),
    label: z.string().describe("Option label"),
  })).describe("Radio button options"),
  selected: z.string().optional().describe("Currently selected value"),
  name: z.string().describe("Radio group name"),
  disabled: z.boolean().optional().describe("Whether the radio group is disabled"),
});

const PkSelectSchema = z.object({
  options: z.array(z.object({
    value: z.string().describe("Option value"),
    label: z.string().describe("Option label"),
  })).describe("Select dropdown options"),
  placeholder: z.string().optional().describe("Placeholder text"),
  selected: z.string().optional().describe("Currently selected value"),
  disabled: z.boolean().optional().describe("Whether the select is disabled"),
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
        inputSchema: zodToJsonSchema(EchoSchema) as ToolInput,
      },
      {
        name: ToolName.PK_BUTTON,
        description: "Renders a clickable button element with customizable text and styling",
        inputSchema: zodToJsonSchema(PkButtonSchema) as ToolInput,
      },
      {
        name: ToolName.PK_CHECKBOX,
        description: "Renders a checkbox input that allows users to select or deselect an option",
        inputSchema: zodToJsonSchema(PkCheckboxSchema) as ToolInput,
      },
      {
        name: ToolName.PK_FORM,
        description: "Renders a form container that can hold multiple input fields and a submit button",
        inputSchema: zodToJsonSchema(PkFormSchema) as ToolInput,
      },
      {
        name: ToolName.PK_INPUT,
        description: "Renders an input field into which user can input plain text value or number",
        inputSchema: zodToJsonSchema(PkInputSchema) as ToolInput,
      },
      {
        name: ToolName.PK_RADIO,
        description: "Renders a group of radio buttons where only one option can be selected at a time",
        inputSchema: zodToJsonSchema(PkRadioSchema) as ToolInput,
      },
      {
        name: ToolName.PK_SELECT,
        description: "Renders a dropdown select element that allows users to choose one option from a list",
        inputSchema: zodToJsonSchema(PkSelectSchema) as ToolInput,
      }
    ];

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === ToolName.ECHO) {
      const validatedArgs = EchoSchema.parse(args);
      broadcastToClients({
        type: 'render-component',
        component: {
          name: 'Echo',
          props: { message: validatedArgs.message }
        }
      });
      return {
        content: [{ type: "text", text: `Echo: ${validatedArgs.message}` }],
      };
    }

    if (name === ToolName.PK_BUTTON) {
      const validatedArgs = PkButtonSchema.parse(args);
      broadcastToClients({
        type: 'render-component',
        component: {
          name: 'Button',
          props: {
            text: validatedArgs.text,
            type: validatedArgs.type || 'primary',
            disabled: validatedArgs.disabled || false
          }
        }
      });
      return {
        content: [{ type: "text", text: `PkButton: text="${validatedArgs.text}", type="${validatedArgs.type || 'primary'}", disabled=${validatedArgs.disabled || false}` }],
      };
    }

    if (name === ToolName.PK_CHECKBOX) {
      const validatedArgs = PkCheckboxSchema.parse(args);
      broadcastToClients({
        type: 'render-component',
        component: {
          name: 'Checkbox',
          props: {
            label: validatedArgs.label,
            checked: validatedArgs.checked || false,
            disabled: validatedArgs.disabled || false
          }
        }
      });
      return {
        content: [{ type: "text", text: `PkCheckbox: label="${validatedArgs.label}", checked=${validatedArgs.checked || false}, disabled=${validatedArgs.disabled || false}` }],
      };
    }

    if (name === ToolName.PK_FORM) {
      const validatedArgs = PkFormSchema.parse(args);
      broadcastToClients({
        type: 'render-component',
        component: {
          name: 'Form',
          props: {
            fields: validatedArgs.fields,
            submitText: validatedArgs.submitText || 'Submit'
          }
        }
      });
      return {
        content: [{ type: "text", text: `PkForm: fields=${JSON.stringify(validatedArgs.fields)}, submitText="${validatedArgs.submitText || 'Submit'}"` }],
      };
    }

    if (name === ToolName.PK_INPUT) {
      const validatedArgs = PkInputSchema.parse(args);
      broadcastToClients({
        type: 'render-component',
        component: {
          name: 'Input',
          props: {
            placeholder: validatedArgs.placeholder || '',
            value: validatedArgs.value || '',
            type: validatedArgs.type || 'text',
            disabled: validatedArgs.disabled || false
          }
        }
      });
      return {
        content: [{ type: "text", text: `PkInput: placeholder="${validatedArgs.placeholder || ''}", value="${validatedArgs.value || ''}", type="${validatedArgs.type || 'text'}", disabled=${validatedArgs.disabled || false}` }],
      };
    }

    if (name === ToolName.PK_RADIO) {
      const validatedArgs = PkRadioSchema.parse(args);
      broadcastToClients({
        type: 'render-component',
        component: {
          name: 'Radio',
          props: {
            name: validatedArgs.name,
            options: validatedArgs.options,
            selected: validatedArgs.selected || '',
            disabled: validatedArgs.disabled || false
          }
        }
      });
      return {
        content: [{ type: "text", text: `PkRadio: name="${validatedArgs.name}", options=${JSON.stringify(validatedArgs.options)}, selected="${validatedArgs.selected || ''}", disabled=${validatedArgs.disabled || false}` }],
      };
    }

    if (name === ToolName.PK_SELECT) {
      const validatedArgs = PkSelectSchema.parse(args);
      broadcastToClients({
        type: 'render-component',
        component: {
          name: 'Select',
          props: {
            options: validatedArgs.options,
            placeholder: validatedArgs.placeholder || '',
            selected: validatedArgs.selected || '',
            disabled: validatedArgs.disabled || false
          }
        }
      });
      return {
        content: [{ type: "text", text: `PkSelect: options=${JSON.stringify(validatedArgs.options)}, placeholder="${validatedArgs.placeholder || ''}", selected="${validatedArgs.selected || ''}", disabled=${validatedArgs.disabled || false}` }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
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
