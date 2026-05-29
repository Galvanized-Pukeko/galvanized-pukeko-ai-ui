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

export type ClientToolHandler = (
  args: unknown,
  ctx: { toolCallId: string; signal: AbortSignal },
) => Promise<unknown> | unknown

export interface SendMessageOptions {
  tools?: Tool[]
  clientToolHandlers?: Record<string, ClientToolHandler>
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
      // `toolCallArgs` is the fully-accumulated, parsed args. The streamed
      // `buffer` lags one delta behind — AG-UI fires onToolCallArgsEvent with
      // the buffer *before* appending the current delta, so for tool calls sent
      // as a single args delta (e.g. Ollama) the buffer is empty and the args
      // only ever materialise here. Forward the parsed args; fall back to the
      // raw buffer only when parsing produced nothing.
      const argsString =
        toolCallArgs && Object.keys(toolCallArgs).length > 0
          ? JSON.stringify(toolCallArgs)
          : buffer
      callbacks.onToolCallEnd?.(event.toolCallId, toolCallName ?? '', argsString)
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

// Walk the agent's message log and return tool calls (in order) that have no
// matching tool-result message and whose name the caller registered a handler
// for. The server-side LangGraph interrupt pauses at the first client tool, so
// in practice this returns 0 or 1 entries per run.
function findUnfulfilledClientToolCalls(
  messages: Message[],
  handlers: Record<string, ClientToolHandler> | undefined,
): Array<{ id: string; name: string; argsRaw: string }> {
  if (!handlers) return []
  const haveResultFor = new Set<string>()
  for (const m of messages) {
    if (m.role === 'tool') {
      const id = (m as { toolCallId?: string }).toolCallId
      if (id) haveResultFor.add(id)
    }
  }
  const unfulfilled: Array<{ id: string; name: string; argsRaw: string }> = []
  for (const m of messages) {
    if (m.role !== 'assistant') continue
    const toolCalls = (m as { toolCalls?: Array<{ id: string; function: { name: string; arguments: string } }> }).toolCalls
    if (!toolCalls) continue
    for (const tc of toolCalls) {
      if (haveResultFor.has(tc.id)) continue
      if (!handlers[tc.function.name]) continue
      unfulfilled.push({ id: tc.id, name: tc.function.name, argsRaw: tc.function.arguments })
    }
  }
  return unfulfilled
}

class ChatService {
  private agent: HttpAgent | null = null
  // Latched by stop(); blocks the tool-fulfilment loop from resuming the agent.
  // Cleared when a new message is sent or the thread is reset.
  private stopped = false
  // Plumbed into client tool handlers so an operator stop can cancel an
  // in-flight motion HTTP call to the robot, not just the next resume run.
  private runAbort: AbortController | null = null

  get isStopped(): boolean {
    return this.stopped
  }

  /**
   * Operator interrupt ("emergency stop"). Aborts any in-flight model stream
   * and latches `stopped` so the client-tool resume loop won't restart the
   * agent. The robot's own motion can't be interrupted mid-cycle, but no
   * further turns will run. Re-armed by sendMessage()/resetThread().
   */
  stop(): void {
    this.stopped = true
    // Cancel an in-flight client tool handler (e.g. a fetch to the robot).
    this.runAbort?.abort()
    if (this.agent) {
      try {
        this.agent.abortRun()
      } catch {
        // abortRun() on an idle agent is a no-op; ignore.
      }
    }
    setRunState('idle', 'Stopped by operator')
  }

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
    this.stopped = false
    const config = configService.get()
    this.agent = new HttpAgent({
      url: config.agUiUrl,
    })
  }

  getThreadId(): string {
    return this.ensureAgent().threadId
  }

  async sendMessage(text: string, callbacks: ChatCallbacks, opts?: SendMessageOptions): Promise<void> {
    // A fresh user message re-arms the agent after an operator stop.
    this.stopped = false
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
      await this.runLoop(agent, callbacks, opts ?? {})
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
    if (this.stopped) return
    const agent = this.ensureAgent()

    console.log('[ChatService] submitUserAction:', content)

    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
    } as UserMessage)

    if (!callbacks) return

    await this.runLoop(agent, callbacks, {})
  }

  /**
   * Drives one user turn end-to-end: send the prompt, await runAgent (which
   * resolves on RUN_FINISHED — the server pauses at the first client-tool
   * interrupt), then walk the message log for any unfulfilled client tool
   * call, run its handler, and resume. Repeat until no client tool calls are
   * outstanding.
   *
   * Mirrors CopilotKit's `run-handler.ts:runAgent` + `processAgentResult`
   * loop. The key invariant is that the prior run is fully torn down before a
   * new POST is issued — so concurrent SSE streams over the same thread_id
   * can't race on the langgraph checkpoint.
   */
  private async runLoop(
    agent: HttpAgent,
    callbacks: ChatCallbacks,
    opts: SendMessageOptions,
  ): Promise<void> {
    this.runAbort = new AbortController()
    let forwardedProps: Record<string, unknown> | undefined
    try {
      // Bounded so a buggy handler/server can't spin us forever.
      for (let i = 0; i < 64; i++) {
        if (this.stopped) return

        // Tear down any previous run's RxJS pipeline before starting a new
        // POST. detachActiveRun() is a no-op if nothing is in flight.
        await agent.detachActiveRun()

        await agent.runAgent(
          {
            tools: opts.tools,
            ...(forwardedProps ? { forwardedProps } : {}),
          },
          buildSubscriber(callbacks),
        )

        if (this.stopped) return

        const unfulfilled = findUnfulfilledClientToolCalls(agent.messages, opts.clientToolHandlers)
        if (unfulfilled.length === 0) return

        // The server interrupts at the first client tool, so process one per
        // iteration. A second tool call (if the model emitted any) shows up
        // unfulfilled on the next pass after this one is resumed.
        const next = unfulfilled[0]
        const handler = opts.clientToolHandlers![next.name]
        let args: unknown = {}
        try {
          args = next.argsRaw ? JSON.parse(next.argsRaw) : {}
        } catch (e) {
          console.warn('[ChatService] Failed to parse tool args', e)
        }

        let resumeValue: unknown
        try {
          resumeValue = await handler(args, {
            toolCallId: next.id,
            signal: this.runAbort.signal,
          })
        } catch (error) {
          console.error('[ChatService] Client tool handler error', error)
          resumeValue = JSON.stringify({ error: String(error) })
        }

        if (this.stopped) return

        forwardedProps = {
          command: { resume: resumeValue, interruptEvent: { toolCallId: next.id } },
        }
      }
      console.warn('[ChatService] runLoop exceeded iteration cap; bailing out.')
    } finally {
      this.runAbort = null
    }
  }
}

export const chatService = new ChatService()
export type { Message }
