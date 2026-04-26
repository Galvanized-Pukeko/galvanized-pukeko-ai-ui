<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from 'vue'
import PkButton from './PkButton.vue'
import PkInput from './PkInput.vue'
import ToolCallBadge from './ToolCallBadge.vue'
import {chatService} from '../services/chatService'
import type {AssistantStreamingMessage, ChatCallbacks, MessagePart} from '../services/chatService'
import type { useA2UI } from '../composables/useA2UI'
import type { Tool } from '@ag-ui/client'

interface UserChatMessage {
  kind: 'user'
  id: number | string
  text: string
}

interface AssistantChatMessage {
  kind: 'assistant'
  id: string
  parts: MessagePart[]
  done: boolean
}

type ChatMessage = UserChatMessage | AssistantChatMessage

const props = defineProps<{
  a2ui?: ReturnType<typeof useA2UI>
  clientTools?: Tool[]
  clientToolHandlers?: Record<string, (args: unknown, ctx: { toolCallId: string }) => Promise<string> | string>
}>()

const messages = ref<ChatMessage[]>([])
const newMessage = ref('')
const isLoading = ref(false)
const currentRunId = ref<string | undefined>(undefined)

const messagesEl = ref<HTMLElement | null>(null)
const userHasScrolledUp = ref(false)
const NEAR_BOTTOM_PX = 64

function scrollToBottom() {
  const el = messagesEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function onScroll() {
  const el = messagesEl.value
  if (!el) return
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight
  userHasScrolledUp.value = distance > NEAR_BOTTOM_PX
}

watch(
  messages,
  () => {
    nextTick(() => {
      if (!userHasScrolledUp.value) scrollToBottom()
    })
  },
  { deep: true }
)

onMounted(() => {
  messages.value.push({
    kind: 'assistant',
    id: `greeting-${Date.now()}`,
    parts: [{ kind: 'text', text: 'Hello! How can I help you today?' }],
    done: true,
  })
  nextTick(scrollToBottom)
})

function upsertAssistantMessage(msg: AssistantStreamingMessage) {
  const last = messages.value[messages.value.length - 1]
  const next: AssistantChatMessage = {
    kind: 'assistant',
    id: msg.id,
    parts: msg.parts,
    done: msg.done,
  }
  if (last && last.kind === 'assistant' && last.id === msg.id && !last.done) {
    messages.value.splice(messages.value.length - 1, 1, next)
  } else {
    messages.value.push(next)
  }
}

function createStreamCallbacks(): ChatCallbacks {
  const callbacks: ChatCallbacks = {
    onRunStart(runId: string) {
      currentRunId.value = runId
    },
    onMessageUpdate(msg) {
      upsertAssistantMessage(msg)
    },
    onToolCallStart(toolCallId: string, toolCallName: string) {
      if (toolCallName === 'show_a2ui_surface' && props.a2ui) {
        props.a2ui.pendingToolCallId.value = toolCallId
      }
    },
    onToolCallEnd(toolCallId: string, toolCallName: string, toolCallBuffer: string) {
      if (props.clientToolHandlers && props.clientToolHandlers[toolCallName]) {
        const handler = props.clientToolHandlers[toolCallName]
        let args: unknown = {}
        try {
          args = toolCallBuffer ? JSON.parse(toolCallBuffer) : {}
        } catch (e) {
          console.warn('[ChatInterface] Failed to parse tool args', e)
        }

        Promise.resolve(handler(args, { toolCallId }))
          .then((result) => {
            chatService.resumeWithCommand(
              result,
              { toolCallId, runId: currentRunId.value },
              createStreamCallbacks(),
              { tools: props.clientTools }
            )
          })
          .catch((error) => {
            console.error('[ChatInterface] Error in client tool handler', error)
            chatService.resumeWithCommand(
              JSON.stringify({ error: String(error) }),
              { toolCallId, runId: currentRunId.value },
              createStreamCallbacks(),
              { tools: props.clientTools }
            )
          })
      }
    },
    onToolCallResult(toolCallId: string, toolCallName: string, content: string) {
      if (toolCallName === 'show_a2ui_surface' && props.a2ui) {
        try {
          const agentMessages: unknown[] = []
          let depth = 0
          let start = -1
          for (let i = 0; i < content.length; i++) {
            const c = content[i]
            if (c === '{') {
              if (depth === 0) start = i
              depth++
            } else if (c === '}') {
              depth--
              if (depth === 0 && start !== -1) {
                agentMessages.push(JSON.parse(content.slice(start, i + 1)))
                start = -1
              }
            }
          }
          props.a2ui.processBatch(agentMessages)
        } catch (e) {
          console.error('[ChatInterface] Failed to parse A2UI JSONL:', e, content)
        }
      }
    },
    onError(error: string) {
      messages.value.push({
        kind: 'assistant',
        id: `error-${Date.now()}`,
        parts: [{ kind: 'text', text: `Error: ${error}` }],
        done: true,
      })
    }
  }

  if (props.a2ui) {
    props.a2ui.setCallbacks(callbacks)
  }

  return callbacks
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return

  const text = newMessage.value
  messages.value.push({
    kind: 'user',
    id: Date.now(),
    text: text,
  })

  newMessage.value = ''
  isLoading.value = true
  userHasScrolledUp.value = false

  try {
    await chatService.sendMessage(text, createStreamCallbacks(), { tools: props.clientTools })
  } catch (error) {
    console.error('Failed to send message:', error)
    const last = messages.value[messages.value.length - 1]
    const lastIsError =
      last?.kind === 'assistant' &&
      last.parts[0]?.kind === 'text' &&
      last.parts[0].text.startsWith('Error:')
    if (!lastIsError) {
      messages.value.push({
        kind: 'assistant',
        id: `error-${Date.now()}`,
        parts: [{ kind: 'text', text: 'Error sending message. Please try again.' }],
        done: true,
      })
    }
  } finally {
    isLoading.value = false
  }
}

const sendFormMessage = async (text: string) => {
  if (isLoading.value) return

  messages.value.push({
    kind: 'user',
    id: Date.now(),
    text: text,
  })

  isLoading.value = true
  userHasScrolledUp.value = false

  try {
    await chatService.sendMessage(text, createStreamCallbacks(), { tools: props.clientTools })
  } catch (error) {
    console.error('Failed to send form message:', error)
    const last = messages.value[messages.value.length - 1]
    const lastIsError =
      last?.kind === 'assistant' &&
      last.parts[0]?.kind === 'text' &&
      last.parts[0].text.startsWith('Error:')
    if (!lastIsError) {
      messages.value.push({
        kind: 'assistant',
        id: `error-${Date.now()}`,
        parts: [{ kind: 'text', text: 'Error sending message. Please try again.' }],
        done: true,
      })
    }
  } finally {
    isLoading.value = false
  }
}

defineExpose({
  sendFormMessage
})
</script>

<template>
  <div class="chat-interface" :class="{ 'is-loading': isLoading }">
    <div class="messages" ref="messagesEl" @scroll="onScroll">
      <template v-for="item in messages" :key="item.id">
        <div
          v-if="item.kind === 'user'"
          class="message user"
        >
          <div class="message-content">{{ item.text }}</div>
        </div>
        <div
          v-else
          class="message ai"
          :class="{ streaming: !item.done }"
        >
          <div class="message-content">
            <template v-for="(part, i) in item.parts" :key="i">
              <span v-if="part.kind === 'text'" class="text-part">{{ part.text }}</span>
              <ToolCallBadge v-else :part="part" />
            </template>
            <span v-if="!item.done" class="typing-indicator"></span>
          </div>
        </div>
      </template>
    </div>
    <div class="input-area">
      <PkInput
        v-model="newMessage"
        placeholder="Type a message..."
        @keyup.enter="sendMessage"
        name="chat-input"
      />
      <PkButton @click="sendMessage">Send</PkButton>
    </div>
    <div class="helper-text">Click Send or press Enter to send your message</div>
  </div>
</template>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  position: relative;
}

.chat-interface.is-loading::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 10;
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.ai {
  align-self: flex-start;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  font-size: 0.95rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.message.user .message-content {
  background-color: #3b82f6;
  color: white;
  border-bottom-right-radius: 0.25rem;
  white-space: pre-wrap;
}

.message.ai .message-content {
  background-color: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 0.25rem;
}

.text-part {
  white-space: pre-wrap;
}

.typing-indicator {
  display: inline-block;
  width: 0.5em;
  height: 1em;
  background-color: #6b7280;
  margin-left: 2px;
  animation: blink 0.7s infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.input-area {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
  background: #fff;
}

.helper-text {
  padding: 0 1rem 1rem 1rem;
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: center;
  background: #fff;
}
</style>
