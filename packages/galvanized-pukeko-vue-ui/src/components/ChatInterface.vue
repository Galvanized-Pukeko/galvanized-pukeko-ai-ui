<script setup lang="ts">
import {onMounted, ref} from 'vue'
import PkButton from './PkButton.vue'
import PkInput from './PkInput.vue'
import {chatService} from '../services/chatService'
import type {ChatCallbacks} from '../services/chatService'

interface Message {
  id: number | string
  text: string
  sender: 'user' | 'ai'
}

const messages = ref<Message[]>([])
const newMessage = ref('')
const isLoading = ref(false)

// Real-time streaming state
const streamingMessage = ref<{ id: string; text: string } | null>(null)

onMounted(() => {
  // No session creation needed with AG-UI — just show a greeting
  messages.value.push({
    id: Date.now(),
    text: 'Hello! How can I help you today?',
    sender: 'ai'
  })
})

function createStreamCallbacks(): ChatCallbacks {
  return {
    onStreamStart(messageId: string) {
      streamingMessage.value = { id: messageId, text: '' }
    },
    onStreamDelta(_messageId: string, fullText: string) {
      if (streamingMessage.value) {
        streamingMessage.value = { ...streamingMessage.value, text: fullText }
      }
    },
    onStreamEnd(messageId: string, finalText: string) {
      // Finalize streaming message into history
      streamingMessage.value = null
      if (finalText.trim()) {
        messages.value.push({
          id: messageId,
          text: finalText,
          sender: 'ai'
        })
      }
    },
    onError(error: string) {
      streamingMessage.value = null
      messages.value.push({
        id: Date.now(),
        text: `Error: ${error}`,
        sender: 'ai'
      })
    }
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return

  const text = newMessage.value
  messages.value.push({
    id: Date.now(),
    text: text,
    sender: 'user'
  })

  newMessage.value = ''
  isLoading.value = true

  try {
    await chatService.sendMessage(text, createStreamCallbacks())
  } catch (error) {
    console.error('Failed to send message:', error)
    // Only add error message if the stream callbacks didn't already handle it
    if (!streamingMessage.value) {
      const lastMsg = messages.value[messages.value.length - 1]
      if (!lastMsg || !lastMsg.text.startsWith('Error:')) {
        messages.value.push({
          id: Date.now(),
          text: 'Error sending message. Please try again.',
          sender: 'ai'
        })
      }
    }
    streamingMessage.value = null
  } finally {
    isLoading.value = false
  }
}

/**
 * Send a form message to the agent (called from App.vue on form submit/cancel)
 */
const sendFormMessage = async (text: string) => {
  if (isLoading.value) return

  messages.value.push({
    id: Date.now(),
    text: text,
    sender: 'user'
  })

  isLoading.value = true

  try {
    await chatService.sendMessage(text, createStreamCallbacks())
  } catch (error) {
    console.error('Failed to send form message:', error)
    if (!streamingMessage.value) {
      const lastMsg = messages.value[messages.value.length - 1]
      if (!lastMsg || !lastMsg.text.startsWith('Error:')) {
        messages.value.push({
          id: Date.now(),
          text: 'Error sending message. Please try again.',
          sender: 'ai'
        })
      }
    }
    streamingMessage.value = null
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
    <div class="messages">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.sender]"
      >
        <div class="message-content">
          {{ msg.text }}
        </div>
      </div>
      <!-- Streaming message with typing indicator -->
      <div v-if="streamingMessage" class="message ai streaming">
        <div class="message-content">
          {{ streamingMessage.text }}<span class="typing-indicator"></span>
        </div>
      </div>
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
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message.user .message-content {
  background-color: #10b981;
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.message.ai .message-content {
  background-color: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 0.25rem;
}

.message.streaming .message-content {
  background-color: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 0.25rem;
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

.message.tool-call {
  max-width: 60%;
}

.tool-call-content {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.3;
  background-color: #dbeafe;
  color: #1e40af;
  border-left: 3px solid #3b82f6;
  font-style: italic;
}

.tool-call-content strong {
  font-weight: 600;
  font-style: normal;
}

.tool-call-header {
  margin-bottom: 0.25rem;
}

.tool-response-details {
  margin-top: 0.5rem;
  border-top: 1px solid #93c5fd;
  padding-top: 0.5rem;
}

.tool-response-details summary {
  cursor: pointer;
  font-size: 0.8rem;
  color: #2563eb;
  user-select: none;
  padding: 0.25rem 0;
  font-style: normal;
  font-weight: 500;
}

.tool-response-details summary:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.tool-response-details[open] summary {
  margin-bottom: 0.5rem;
}

.tool-response-data {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  color: #334155;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
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
