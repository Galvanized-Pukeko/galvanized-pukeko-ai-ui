import { configService } from './configService'
import { HttpAgent } from '@ag-ui/client'
import type { AgentSubscriber } from '@ag-ui/client'
import type { Message, UserMessage } from '@ag-ui/client'

export interface StreamingSlot {
  messageId: string
  text: string
}

export interface ToolCallInfo {
  toolCallId: string
  toolCallName: string
  toolCallBuffer: string
}

export interface ChatCallbacks {
  onStreamStart: (messageId: string) => void
  onStreamDelta: (messageId: string, fullText: string) => void
  onStreamEnd: (messageId: string, finalText: string) => void
  onError: (error: string) => void
}

class ChatService {
  private agent: HttpAgent | null = null

  private ensureAgent(): HttpAgent {
    if (!this.agent) {
      const config = configService.get()
      this.agent = new HttpAgent({
        url: config.agUiUrl,
      })
    }
    return this.agent
  }

  /**
   * Reset the conversation (new thread)
   */
  resetThread(): void {
    const config = configService.get()
    this.agent = new HttpAgent({
      url: config.agUiUrl,
    })
  }

  getThreadId(): string {
    return this.ensureAgent().threadId
  }

  /**
   * Send a message and stream the response in real-time via callbacks.
   */
  async sendMessage(text: string, callbacks: ChatCallbacks): Promise<void> {
    const agent = this.ensureAgent()

    console.log('[ChatService] Sending message:', text)

    // Add user message to the agent's managed message history
    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    agent.addMessage(userMessage)

    console.log('[ChatService] AG-UI request to:', agent.url)

    const subscriber: AgentSubscriber = {
      onTextMessageStartEvent({ event }) {
        console.log('[ChatService] Stream start, messageId:', event.messageId)
        callbacks.onStreamStart(event.messageId)
      },
      onTextMessageContentEvent({ event, textMessageBuffer }) {
        callbacks.onStreamDelta(event.messageId, textMessageBuffer)
      },
      onTextMessageEndEvent({ event, textMessageBuffer }) {
        console.log('[ChatService] Stream end, length:', textMessageBuffer.length)
        callbacks.onStreamEnd(event.messageId, textMessageBuffer)
      },
      onToolCallStartEvent({ event }) {
        console.log('[ChatService] Tool call start:', event.toolCallId, event.toolCallName)
      },
      onToolCallArgsEvent({ toolCallBuffer, toolCallName }) {
        console.log('[ChatService] Tool call args:', toolCallName, toolCallBuffer)
      },
      onToolCallEndEvent({ toolCallName, toolCallArgs }) {
        console.log('[ChatService] Tool call end:', toolCallName, toolCallArgs)
        // Phase 3: if toolCallName === 'show_a2ui_surface', dispatch to A2UI composable
      },
      onRunErrorEvent({ event }) {
        console.error('[ChatService] Run error:', event.message)
        callbacks.onError(event.message)
      },
    }

    try {
      await agent.runAgent({}, subscriber)
    } catch (error) {
      console.error('[ChatService] Error sending message:', error)
      // Remove the user message we added since the request failed
      agent.messages = agent.messages.filter((m: Message) => m.id !== userMessage.id)
      throw error
    }
  }

  /**
   * Stub for Phase 3: submit a tool result back to the agent.
   */
  async submitToolResult(_toolCallId: string, _content: string): Promise<void> {
    // Phase 3 implementation
    console.log('[ChatService] submitToolResult stub called:', _toolCallId)
  }
}

export const chatService = new ChatService()
export type { Message }
