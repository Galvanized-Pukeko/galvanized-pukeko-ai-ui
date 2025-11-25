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
import { createWebSocketServer, WebSocketServerManager } from './websocket-server';

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const serverContext = {
  mcpServer: undefined as Server,
  webSocketManager: undefined as WebSocketServerManager,
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

const ChartSchema = z.object({
  type: z.enum(['bar', 'pie']).describe("Chart type (bar or pie)"),
  title: z.string().describe("Chart title"),
  data: z.array(z.number()).describe("Chart data values"),
  labels: z.array(z.string()).describe("Chart data labels"),
});

enum ToolName {
  PK_FORM = "pk_form",
  PK_CHARTS = "pk_charts",
}

// Set up WebSocket server
const WS_PORT = 3001;
const wsManager = createWebSocketServer(WS_PORT);
serverContext.webSocketManager = wsManager;

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

  // Set MCP server reference in WebSocket manager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (wsManager as any).setMcpServer(server);

  let logLevel: LoggingLevel = "debug";

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: ToolName.PK_FORM,
        description: "Renders a form with multiple components (button, checkbox, input, radio, select)",
        inputSchema: zodToJsonSchema(FormSchema) as ToolInput,
      },
      {
        name: ToolName.PK_CHARTS,
        description: "Renders charts (bar or pie) with data and labels",
        inputSchema: zodToJsonSchema(ChartSchema) as ToolInput,
      }
    ];

    return {tools};
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {name, arguments: args} = request.params;

    if (name === ToolName.PK_FORM) {
      const {components, submitLabel, cancelLabel} = FormSchema.parse(args);

      serverContext.webSocketManager.broadcastToClients({
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
    } else if (name === ToolName.PK_CHARTS) {
      const {type, title, data, labels} = ChartSchema.parse(args);

      // Generate random colors for the chart
      const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ];

      const chartData = {
        labels: labels,
        datasets: [{
          label: title,
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: colors.slice(0, data.length),
          borderWidth: 1
        }]
      };

      serverContext.webSocketManager.broadcastToClients({
        type: 'chart',
        chartType: type,
        title: title,
        data: chartData
      });

      return {
        content: [{
          type: "text",
          text: `${type.charAt(0).toUpperCase() + type.slice(1)} chart "${title}" sent successfully`
        }],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
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
    await serverContext.webSocketManager.cleanup();
  };

  return {server, cleanup};
};
