import {z} from "zod";
import {HumanMessage} from '@langchain/core/messages';

export async function configure() {
  const {ChatVertexAI} = await import('@langchain/google-vertexai');
  return {
    llm: new ChatVertexAI({
      model: 'gemini-2.5-pro',
    }),
    mcpServers: {
      'pukeko-ui': {
        transport: 'http',
        'url': 'http://localhost:3002/mcp'
      }
    },
    mcpInitHandler: (
      config,
      invocation,
      multiClient
    ) => {
      console.log('mcpInitHandler', multiClient);

      /**
       * FIXME somehow when doing multiClient.getClient('pukeko-ui') too early we end up with two instances of the client.
       * FIXME We need to figure out something better than the timeout
       */
      setTimeout(() => {
        multiClient.getClient('pukeko-ui').then((client) => {
          client.setRequestHandler(z.object({
            method: z.literal('message'),
            // xxx it seems like this listener function can't be async
          }), (props, extra) => {
            // FIXME ideally this should know about the thread ID
            console.log('request handler', props, extra);
            invocation.invoke([new HumanMessage('user cancelled the form')]).then((r) => {
              console.log('invoked');
            });
            return {
              ack: true,
            };
          });
          console.log('client', client);
        });
      }, 5000);
    }
  };
}

/**
 * mcpInitHandler?: (
 *     config: SlothConfig,
 *     invocation: Invocation,
 *     multiClient: MultiServerMCPClient
 *   ) => Promise<void>;
 */
