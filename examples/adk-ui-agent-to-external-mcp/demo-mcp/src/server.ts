import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {z} from "zod/v4";
import {readFileSync, readdirSync} from "fs";
import {join, dirname} from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverContext: { mcpServer: Server | undefined } = {
  mcpServer: undefined,
}

function validateFilename(filename: string): void {
  if (filename.includes('..') || filename.startsWith('/') || filename.includes('\\')) {
    throw new Error('Invalid filename: path traversal attempts are not allowed');
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    throw new Error('Invalid filename: only alphanumeric characters, dots, hyphens, and underscores are allowed');
  }
}

function listFiles(): string[] {
  const filesDir = join(__dirname, '..', 'files');
  try {
    return readdirSync(filesDir).filter(file => file.endsWith('.csv'));
  } catch (error) {
    throw new Error('Unable to read files directory', { cause: error });
  }
}

function readCSVData(filename: string): (string | number)[][] {
  validateFilename(filename);
  const csvPath = join(__dirname, '..', 'files', filename);
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
  LIST_REPORTS = "list_reports",
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
        inputSchema: z.toJSONSchema(z.object({
          filename: z.string().describe("Name of the CSV file to read")
        })) as Tool["inputSchema"],
      },
      {
        name: ToolName.LIST_REPORTS,
        description: "Lists available CSV files in the reports directory.",
        inputSchema: z.toJSONSchema(z.object({})) as Tool["inputSchema"],
      }
    ];

    return {tools};
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {name, arguments: args} = request.params;

    if (name === ToolName.READ_CSV) {
      const filename = args?.filename as string;
      if (!filename) {
        throw new Error('filename parameter is required');
      }

      const data = readCSVData(filename);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data)
        }],
      };
    }

    if (name === ToolName.LIST_REPORTS) {
      const files = listFiles();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(files)
        }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const cleanup = async () => {

  };

  return {server, cleanup};
};
