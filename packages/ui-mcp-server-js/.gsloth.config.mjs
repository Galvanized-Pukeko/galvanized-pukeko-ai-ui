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
                runner.processMessages([new HumanMessage('user cancelled the form')]).then((r) => {
                  console.log('invoked');
                });
              return {
                ack: true,
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
