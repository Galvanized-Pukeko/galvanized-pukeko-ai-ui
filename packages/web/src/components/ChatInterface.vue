<script setup lang="ts">
import {onMounted, ref} from 'vue'
import PkButton from './PkButton.vue'
import PkInput from './PkInput.vue'
import {chatService} from '../services/chatService'

interface Message {
    id: number | string
    text: string
    sender: 'user' | 'ai'
    toolCall?: string  // Name of the tool that was called
  }

  const messages = ref<Message[]>([])
  const newMessage = ref('')
  const sessionId = ref<string | null>(null)
  const isLoading = ref(false)

  onMounted(async () => {
    try {
      const session = await chatService.createSession()
      sessionId.value = session.id
      messages.value.push({
        id: Date.now(),
        text: 'Hello! How can I help you today?',
        sender: 'ai'
      })
    } catch (error) {
      console.error('Failed to init session:', error)
      messages.value.push({
        id: Date.now(),
        text: 'Error connecting to chat server.',
        sender: 'ai'
      })
    }
  })

  const sendMessage = async () => {
    if (!newMessage.value.trim() || !sessionId.value || isLoading.value) return

    const text = newMessage.value
    messages.value.push({
      id: Date.now(),
      text: text,
      sender: 'user'
    })

    newMessage.value = ''
    isLoading.value = true

    try {
      const response = await chatService.sendMessage(sessionId.value, text)

      // Process all chunks to find function calls
      const functionCalls: string[] = []
      for (const chunk of response.chunks) {
        for (const part of chunk.content.parts) {
          if (part.functionCall) {
            functionCalls.push(part.functionCall.name)
          }
        }
      }

      // Add a message for each function call
      for (const toolName of functionCalls) {
        messages.value.push({
          id: `${response.finalMessage.id}-tool-${toolName}`,
          text: '',
          sender: 'ai',
          toolCall: toolName
        })
      }

      // Extract text from the final message
      const aiText = response.finalMessage.content.parts
        .filter(p => p.text)
        .map(p => p.text)
        .join('\n')

      if (aiText.trim()) {
        messages.value.push({
          id: response.finalMessage.id,
          text: aiText,
          sender: 'ai'
        })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      messages.value.push({
        id: Date.now(),
        text: 'Error sending message. Please try again.',
        sender: 'ai'
      })
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <div class="chat-interface" :class="{ 'is-loading': isLoading }">
    <div class="messages">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.sender, { 'tool-call': msg.toolCall }]"
      >
        <div v-if="msg.toolCall" class="tool-call-content">
          🔧 Called <strong>{{ msg.toolCall }}</strong> tool
        </div>
        <div v-else class="message-content">
          {{ msg.text }}
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
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
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
