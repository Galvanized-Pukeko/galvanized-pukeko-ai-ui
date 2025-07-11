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
      }
    },
    hooks: {
      beforeProcessMessages: (runner, messages, runConfig) => {
        // Safe run config fom first message
        if (!sessionState.runConfig) {
          sessionState.runConfig = runConfig;
        }
      },
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
              // FIXME this explodes without runnable
              if (sessionState.runConfig) {
                runner.processMessages([new HumanMessage('user cancelled the form')], sessionState.runConfig).then((r) => {
                  console.log('invoked');
                });
              } else {
                console.log('no run config');
              }
              return {
                ack: true,
              };
            });
            console.log('client', client);
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
