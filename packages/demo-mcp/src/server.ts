import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {z} from "zod";
import {zodToJsonSchema} from "zod-to-json-schema";

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const serverContext = {
  mcpServer: undefined as Server,
}

enum ToolName {
  READ_CSV = "read_csv",
}

export const createServer = () => {
  const server = new Server(
    {
      name: "data-server",
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

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: ToolName.READ_CSV,
        description: "Reads data from provided CSV file.",
        inputSchema: zodToJsonSchema(z.object({})) as ToolInput,
      }
    ];

    return {tools};
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {name, arguments: args} = request.params;

    if (name !== ToolName.READ_CSV) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const data = [['Aug 2025', 'Sep 2025'], [10, 12]];

    return {
      content: [{
        type: "text",
        text: JSON.stringify(data)
      }],
    };
  });

  const cleanup = async () => {

  };

  return {server, cleanup};
};
