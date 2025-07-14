import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {z} from "zod";
import {zodToJsonSchema} from "zod-to-json-schema";
import {readFileSync} from "fs";
import {join, dirname} from "path";
import {fileURLToPath} from "url";

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverContext = {
  mcpServer: undefined as Server,
}

function readCSVData(): (string | number)[][] {
  const csvPath = join(__dirname, '..', 'sales24m.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  const headers = lines[0].split(',');
  const months: string[] = [headers[0]];
  const sales: (string | number)[] = [headers[1]];
  
  for (let i = 1; i < lines.length; i++) {
    const [month, salesValue] = lines[i].split(',');
    months.push(month);
    sales.push(parseFloat(salesValue));
  }
  
  return [months, sales];
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

    const data = readCSVData();

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
