import { configService } from './configService'
import { HttpAgent } from '@ag-ui/client'
import type { AgentSubscriber } from '@ag-ui/client'
import type { Message, UserMessage, Tool } from '@ag-ui/client'

export interface StreamingSlot {
  messageId: string
  text: string
}

export interface ToolCallInfo {
  toolCallId: string
  toolCallName: string
  toolCallBuffer: string
}

export interface ToolCallRecord {
  toolCallId: string
  toolCallName: string
  args: string
}

export interface ChatCallbacks {
  onRunStart?: (runId: string) => void
  onStreamStart: (messageId: string) => void
  onStreamDelta: (messageId: string, fullText: string) => void
  onStreamEnd: (messageId: string, finalText: string) => void
  onToolCallComplete?: (record: ToolCallRecord) => void
  onToolCallStart?: (toolCallId: string, toolCallName: string) => void
  onToolCallEnd?: (toolCallId: string, toolCallName: string, toolCallBuffer: string) => void
  onToolCallResult?: (toolCallId: string, toolCallName: string, content: string) => void
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
  async sendMessage(text: string, callbacks: ChatCallbacks, opts?: { tools?: Tool[] }): Promise<void> {
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

    // Track the accumulated tool call args buffer per tool call id
    const toolCallBuffers = new Map<string, string>()
    const toolCallNames = new Map<string, string>()

    const subscriber: AgentSubscriber = {
      onRunStartedEvent({ event }) {
        callbacks.onRunStart?.(event.runId)
      },
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
        toolCallBuffers.set(event.toolCallId, '')
        toolCallNames.set(event.toolCallId, event.toolCallName)
        if (callbacks.onToolCallStart) {
          callbacks.onToolCallStart(event.toolCallId, event.toolCallName)
        }
      },
      onToolCallArgsEvent({ event, toolCallBuffer, toolCallName }) {
        console.log('[ChatService] Tool call args:', toolCallName, toolCallBuffer)
        toolCallBuffers.set(event.toolCallId, toolCallBuffer)
      },
      onToolCallEndEvent({ event, toolCallName, toolCallArgs }) {
        console.log('[ChatService] Tool call end:', toolCallName, toolCallArgs)
        const buffer = toolCallBuffers.get(event.toolCallId) ?? ''
        toolCallBuffers.delete(event.toolCallId)
        if (callbacks.onToolCallComplete) {
          callbacks.onToolCallComplete({
            toolCallId: event.toolCallId,
            toolCallName: toolCallName ?? '',
            args: JSON.stringify(toolCallArgs ?? {}),
          })
        }
        if (callbacks.onToolCallEnd) {
          callbacks.onToolCallEnd(event.toolCallId, toolCallName ?? '', buffer)
        }
      },
      onToolCallResultEvent({ event }) {
        console.log('[ChatService] Tool call result:', event.toolCallId)
        const toolCallName = toolCallNames.get(event.toolCallId) ?? ''
        callbacks.onToolCallResult?.(event.toolCallId, toolCallName, event.content ?? '')
      },
      onRunErrorEvent({ event }) {
        console.error('[ChatService] Run error:', event.message)
        callbacks.onError(event.message)
      },
    }

    try {
      await agent.runAgent({ tools: opts?.tools }, subscriber)
    } catch (error) {
      console.error('[ChatService] Error sending message:', error)
      // Remove the user message we added since the request failed
      agent.messages = agent.messages.filter((m: Message) => m.id !== userMessage.id)
      throw error
    }
  }

  /**
   * Submit a user action (e.g. form submission) as a user message and stream the follow-up response.
   * User actions are NOT sent as tool messages — the show_a2ui_surface tool call is already resolved
   * once the surfaceJsonl is returned. A second tool message for the same toolCallId would be invalid.
   */
  async submitToolResult(
    _toolCallId: string,
    content: string,
    callbacks?: ChatCallbacks,
  ): Promise<void> {
    const agent = this.ensureAgent()

    console.log('[ChatService] submitUserAction:', content)

    // Add as a user message — the tool call is already resolved; this is new user input
    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
    } as any)

    if (!callbacks) return

    // Track the accumulated tool call args buffer per tool call id
    const toolCallBuffers = new Map<string, string>()
    const toolCallNames = new Map<string, string>()

    const subscriber: AgentSubscriber = {
      onRunStartedEvent({ event }) {
        callbacks.onRunStart?.(event.runId)
      },
      onTextMessageStartEvent({ event }) {
        callbacks.onStreamStart(event.messageId)
      },
      onTextMessageContentEvent({ event, textMessageBuffer }) {
        callbacks.onStreamDelta(event.messageId, textMessageBuffer)
      },
      onTextMessageEndEvent({ event, textMessageBuffer }) {
        callbacks.onStreamEnd(event.messageId, textMessageBuffer)
      },
      onToolCallStartEvent({ event }) {
        toolCallBuffers.set(event.toolCallId, '')
        toolCallNames.set(event.toolCallId, event.toolCallName)
        callbacks.onToolCallStart?.(event.toolCallId, event.toolCallName)
      },
      onToolCallArgsEvent({ event, toolCallBuffer, toolCallName }) {
        console.log('[ChatService] submitToolResult tool call args:', toolCallName, toolCallBuffer)
        toolCallBuffers.set(event.toolCallId, toolCallBuffer)
      },
      onToolCallEndEvent({ event, toolCallName, toolCallArgs }) {
        const buffer = toolCallBuffers.get(event.toolCallId) ?? ''
        toolCallBuffers.delete(event.toolCallId)
        callbacks.onToolCallComplete?.({
          toolCallId: event.toolCallId,
          toolCallName: toolCallName ?? '',
          args: JSON.stringify(toolCallArgs ?? {}),
        })
        callbacks.onToolCallEnd?.(event.toolCallId, toolCallName ?? '', buffer)
      },
      onToolCallResultEvent({ event }) {
        console.log('[ChatService] submitToolResult tool call result:', event.toolCallId)
        const toolCallName = toolCallNames.get(event.toolCallId) ?? ''
        callbacks.onToolCallResult?.(event.toolCallId, toolCallName, event.content ?? '')
      },
      onRunErrorEvent({ event }) {
        callbacks.onError(event.message)
      },
    }

    await agent.runAgent({}, subscriber)
  }

  /**
   * Resume an interrupted run with a specific command payload.
   */
  async resumeWithCommand(
    resumeValue: unknown,
    interruptEvent: { toolCallId: string; runId?: string },
    callbacks: ChatCallbacks,
    opts?: { tools?: Tool[] }
  ): Promise<void> {
    const agent = this.ensureAgent()
    console.log('[ChatService] Resuming with command')

    const toolCallBuffers = new Map<string, string>()
    const toolCallNames = new Map<string, string>()

    const subscriber: AgentSubscriber = {
      onRunStartedEvent({ event }) {
        callbacks.onRunStart?.(event.runId)
      },
      onTextMessageStartEvent({ event }) {
        callbacks.onStreamStart(event.messageId)
      },
      onTextMessageContentEvent({ event, textMessageBuffer }) {
        callbacks.onStreamDelta(event.messageId, textMessageBuffer)
      },
      onTextMessageEndEvent({ event, textMessageBuffer }) {
        callbacks.onStreamEnd(event.messageId, textMessageBuffer)
      },
      onToolCallStartEvent({ event }) {
        toolCallBuffers.set(event.toolCallId, '')
        toolCallNames.set(event.toolCallId, event.toolCallName)
        callbacks.onToolCallStart?.(event.toolCallId, event.toolCallName)
      },
      onToolCallArgsEvent({ event, toolCallBuffer }) {
        toolCallBuffers.set(event.toolCallId, toolCallBuffer)
      },
      onToolCallEndEvent({ event, toolCallName, toolCallArgs }) {
        const buffer = toolCallBuffers.get(event.toolCallId) ?? ''
        toolCallBuffers.delete(event.toolCallId)
        callbacks.onToolCallComplete?.({
          toolCallId: event.toolCallId,
          toolCallName: toolCallName ?? '',
          args: JSON.stringify(toolCallArgs ?? {}),
        })
        callbacks.onToolCallEnd?.(event.toolCallId, toolCallName ?? '', buffer)
      },
      onToolCallResultEvent({ event }) {
        const toolCallName = toolCallNames.get(event.toolCallId) ?? ''
        callbacks.onToolCallResult?.(event.toolCallId, toolCallName, event.content ?? '')
      },
      onRunErrorEvent({ event }) {
        callbacks.onError(event.message)
      },
    }

    await agent.runAgent(
      {
        tools: opts?.tools,
        forwardedProps: {
          command: { resume: resumeValue, interruptEvent },
        },
      },
      subscriber
    )
  }
}

export const chatService = new ChatService()
export type { Message }
