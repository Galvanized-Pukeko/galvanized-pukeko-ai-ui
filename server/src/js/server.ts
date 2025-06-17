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

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

/* Input schemas for tools implemented in this server */
const EchoSchema = z.object({
  message: z.string().describe("Message to echo"),
});

enum ToolName {
  ECHO = "echo",
}

export const createServer = () => {
  const server = new Server(
    {
      name: "example-servers/everything",
      version: "1.0.0",
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

  let stdErrUpdateInterval: NodeJS.Timeout | undefined;

  let logLevel: LoggingLevel = "debug";
  let logsUpdateInterval: NodeJS.Timeout | undefined;
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
  logsUpdateInterval = setInterval(() => {
    let message = {
      method: "notifications/message",
      params: messages[Math.floor(Math.random() * messages.length)],
    };
    if (!isMessageIgnored(message.params.level as LoggingLevel))
      server.notification(message);
  }, 20000);

  // Set up update interval for stderr messages
  stdErrUpdateInterval = setInterval(() => {
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
      }
    ];

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === ToolName.ECHO) {
      const validatedArgs = EchoSchema.parse(args);
      return {
        content: [{ type: "text", text: `Echo: ${validatedArgs.message}` }],
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
    if (logsUpdateInterval) clearInterval(logsUpdateInterval);
    if (stdErrUpdateInterval) clearInterval(stdErrUpdateInterval);
  };

  return { server, cleanup };
};
