import {z} from "zod";
import {HumanMessage} from '@langchain/core/messages';
import {GthLangChainAgent} from "gaunt-sloth-assistant/core/GthLangChainAgent";

/**
 * @typedef {import('gaunt-sloth-assistant/config').GthConfig} GthConfig
 * @typedef {import('@langchain/core/runnables').RunnableConfig} RunnableConfig
 */


/**
 * This is a cli util, so one run, one session
 */
const sessionState = {
  /**
   * @type RunnableConfig
   */
  runConfig: undefined
};

export async function configure() {
  const {ChatVertexAI} = await import('@langchain/google-vertexai');
  // noinspection UnnecessaryLocalVariableJS
  /**
   * @type GthConfig
   */
  const config = {
    llm: new ChatVertexAI({
      model: 'gemini-2.5-pro',
    }),
    mcpServers: {
      'pukeko-ui': {
        transport: 'http',
        'url': 'http://localhost:3002/mcp'
      },
      'data-server': {
        transport: 'http',
        'url': 'http://localhost:3007/mcp'
      }
    },
    hooks: {
      afterAgentInit: (runner) => {
        const agent = runner.getAgent();
        if (agent instanceof GthLangChainAgent) {
          agent.getMCPClient().getClient('pukeko-ui').then((client) => {
            console.log('beforeAgentInit acquired pukeko-ui client');
            client.setRequestHandler(z.object({
              method: z.literal('message'),
              // xxx it seems like this listener function can't be async
            }), (props, extra) => {
              console.log('request handler', props, extra);
              runner.processMessages([new HumanMessage('user cancelled the last action')]).then((r) => {
                console.log('invoked');
              });
              return {
                ack: true,
              };
            });

            client.setRequestHandler(z.object({
              method: z.literal('form_submit'),
              params: z.object({
                data: z.record(z.union([z.string(), z.boolean(), z.number()])),
                timestamp: z.number()
              })
            }), (props, extra) => {
              console.log('form submission request handler', props, extra);
              const formData = props.params.data;
              const timestamp = new Date(props.params.timestamp).toISOString();

              runner.processMessages([
                new HumanMessage(`User submitted a form with the following data at ${timestamp}:\n${JSON.stringify(formData, null, 2)}`)
              ]).then((r) => {
                console.log('form submission processed');
              });

              return {
                ack: true,
                received: true
              };
            });
          });
        }
      }
    }
  };
  return config;
}

/**
 * mcpInitHandler?: (
 *     config: SlothConfig,
 *     invocation: Invocation,
 *     multiClient: MultiServerMCPClient
 *   ) => Promise<void>;
 */
