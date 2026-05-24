import { ref, type Ref } from 'vue'
import { configService } from './configService'
import { HttpAgent } from '@ag-ui/client'
import type { AgentSubscriber } from '@ag-ui/client'
import type { Message, UserMessage, Tool } from '@ag-ui/client'

// Run-state machine. Surfaces the silent gap between TOOL_CALL_RESULT and the
// next REASONING_MESSAGE_START so the UI can show a progress indicator.
export type RunState = 'idle' | 'streaming' | 'running-tool' | 'waiting'

export const runState: Ref<RunState> = ref('idle')
export const statusText: Ref<string> = ref('')

function setRunState(state: RunState, text: string): void {
  runState.value = state
  statusText.value = text
}

export type MessagePart =
  | { kind: 'text'; text: string }
  | { kind: 'thinking'; text: string; done: boolean }
  | {
      kind: 'tool-call'
      toolCallId: string
      toolCallName: string
      args: unknown
      argsRaw: string
      result?: string
      status: 'pending' | 'complete'
    }

export interface AssistantStreamingMessage {
  id: string
  parts: MessagePart[]
  done: boolean
}

export interface ChatCallbacks {
  onRunStart?: (runId: string) => void
  onMessageUpdate: (msg: AssistantStreamingMessage) => void
  onToolCallStart?: (toolCallId: string, toolCallName: string) => void
  onToolCallEnd?: (toolCallId: string, toolCallName: string, toolCallBuffer: string) => void
  onToolCallResult?: (toolCallId: string, toolCallName: string, content: string) => void
  onError: (error: string) => void
}

function buildSubscriber(callbacks: ChatCallbacks): AgentSubscriber {
  const toolCallBuffers = new Map<string, string>()
  const toolCallNames = new Map<string, string>()

  let currentMsg: AssistantStreamingMessage = { id: '', parts: [], done: false }
  let currentTextPart: { kind: 'text'; text: string } | null = null
  let currentThinkingPart: { kind: 'thinking'; text: string; done: boolean } | null = null

  function emit() {
    callbacks.onMessageUpdate({
      id: currentMsg.id,
      parts: currentMsg.parts.map((p) => ({ ...p })),
      done: currentMsg.done,
    })
  }

  function findToolPart(toolCallId: string) {
    for (let i = currentMsg.parts.length - 1; i >= 0; i--) {
      const p = currentMsg.parts[i]
      if (p.kind === 'tool-call' && p.toolCallId === toolCallId) return p
    }
    return null
  }

  return {
    onRunStartedEvent({ event }) {
      currentMsg = { id: '', parts: [], done: false }
      currentTextPart = null
      currentThinkingPart = null
      setRunState('waiting', 'Waiting for model…')
      callbacks.onRunStart?.(event.runId)
    },
    onTextMessageStartEvent({ event }) {
      if (!currentMsg.id) currentMsg.id = event.messageId
      // Text always closes any open thinking block — model has stopped reasoning
      // and started answering.
      if (currentThinkingPart) {
        currentThinkingPart.done = true
        currentThinkingPart = null
      }
      currentTextPart = { kind: 'text', text: '' }
      currentMsg.parts.push(currentTextPart)
      setRunState('streaming', 'Responding…')
      emit()
    },
    onReasoningMessageStartEvent({ event }) {
      if (!currentMsg.id) currentMsg.id = event.messageId
      currentTextPart = null
      currentThinkingPart = { kind: 'thinking', text: '', done: false }
      currentMsg.parts.push(currentThinkingPart)
      setRunState('streaming', 'Thinking…')
      emit()
    },
    onReasoningMessageContentEvent({ reasoningMessageBuffer }) {
      if (!currentThinkingPart) {
        currentThinkingPart = { kind: 'thinking', text: '', done: false }
        currentMsg.parts.push(currentThinkingPart)
      }
      currentThinkingPart.text = reasoningMessageBuffer
      emit()
    },
    onReasoningMessageEndEvent() {
      if (currentThinkingPart) {
        currentThinkingPart.done = true
        currentThinkingPart = null
        emit()
      }
    },
    onTextMessageContentEvent({ textMessageBuffer }) {
      if (!currentTextPart) {
        currentTextPart = { kind: 'text', text: '' }
        currentMsg.parts.push(currentTextPart)
      }
      currentTextPart.text = textMessageBuffer
      emit()
    },
    onTextMessageEndEvent() {
      currentTextPart = null
      emit()
    },
    onToolCallStartEvent({ event }) {
      console.log('[ChatService] Tool call start:', event.toolCallId, event.toolCallName)
      toolCallBuffers.set(event.toolCallId, '')
      toolCallNames.set(event.toolCallId, event.toolCallName)
      setRunState('running-tool', `Running ${event.toolCallName}…`)
      if (!currentMsg.id) currentMsg.id = event.parentMessageId ?? event.toolCallId
      currentTextPart = null
      if (currentThinkingPart) {
        currentThinkingPart.done = true
        currentThinkingPart = null
      }
      currentMsg.parts.push({
        kind: 'tool-call',
        toolCallId: event.toolCallId,
        toolCallName: event.toolCallName,
        args: {},
        argsRaw: '',
        status: 'pending',
      })
      emit()
      callbacks.onToolCallStart?.(event.toolCallId, event.toolCallName)
    },
    onToolCallArgsEvent({ event, toolCallBuffer, toolCallName }) {
      console.log('[ChatService] Tool call args:', toolCallName, toolCallBuffer)
      toolCallBuffers.set(event.toolCallId, toolCallBuffer)
      const part = findToolPart(event.toolCallId)
      if (part && part.kind === 'tool-call') {
        part.argsRaw = toolCallBuffer
        emit()
      }
    },
    onToolCallEndEvent({ event, toolCallName, toolCallArgs }) {
      console.log('[ChatService] Tool call end:', toolCallName, toolCallArgs)
      const buffer = toolCallBuffers.get(event.toolCallId) ?? ''
      toolCallBuffers.delete(event.toolCallId)
      const part = findToolPart(event.toolCallId)
      if (part && part.kind === 'tool-call') {
        part.args = toolCallArgs ?? {}
        if (toolCallName) part.toolCallName = toolCallName
        // Stay 'pending' until the result arrives.
        emit()
      }
      callbacks.onToolCallEnd?.(event.toolCallId, toolCallName ?? '', buffer)
    },
    onToolCallResultEvent({ event }) {
      console.log('[ChatService] Tool call result:', event.toolCallId)
      const toolCallName = toolCallNames.get(event.toolCallId) ?? ''
      const part = findToolPart(event.toolCallId)
      if (part && part.kind === 'tool-call') {
        part.result = event.content ?? ''
        part.status = 'complete'
        emit()
      }
      // Tool result is in; the model is about to (silently) chew on the new
      // image / text before its next token. Surface that gap.
      setRunState('waiting', 'Waiting for model…')
      callbacks.onToolCallResult?.(event.toolCallId, toolCallName, event.content ?? '')
    },
    onRunFinishedEvent() {
      currentMsg.done = true
      // Mark any still-pending tool calls as complete; the run is over.
      for (const part of currentMsg.parts) {
        if (part.kind === 'tool-call' && part.status === 'pending') {
          part.status = 'complete'
        } else if (part.kind === 'thinking' && !part.done) {
          part.done = true
        }
      }
      currentThinkingPart = null
      setRunState('idle', '')
      emit()
    },
    onRunErrorEvent({ event }) {
      console.error('[ChatService] Run error:', event.message)
      setRunState('idle', '')
      callbacks.onError(event.message)
    },
  }
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

  resetThread(): void {
    const config = configService.get()
    this.agent = new HttpAgent({
      url: config.agUiUrl,
    })
  }

  getThreadId(): string {
    return this.ensureAgent().threadId
  }

  async sendMessage(text: string, callbacks: ChatCallbacks, opts?: { tools?: Tool[] }): Promise<void> {
    const agent = this.ensureAgent()

    console.log('[ChatService] Sending message:', text)

    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    agent.addMessage(userMessage)

    console.log('[ChatService] AG-UI request to:', agent.url)

    try {
      await agent.runAgent({ tools: opts?.tools }, buildSubscriber(callbacks))
    } catch (error) {
      console.error('[ChatService] Error sending message:', error)
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

    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
    } as UserMessage)

    if (!callbacks) return

    await agent.runAgent({}, buildSubscriber(callbacks))
  }

  async resumeWithCommand(
    resumeValue: unknown,
    interruptEvent: { toolCallId: string; runId?: string },
    callbacks: ChatCallbacks,
    opts?: { tools?: Tool[] }
  ): Promise<void> {
    const agent = this.ensureAgent()
    console.log('[ChatService] Resuming with command')

    await agent.runAgent(
      {
        tools: opts?.tools,
        forwardedProps: {
          command: { resume: resumeValue, interruptEvent },
        },
      },
      buildSubscriber(callbacks)
    )
  }
}

export const chatService = new ChatService()
export type { Message }
