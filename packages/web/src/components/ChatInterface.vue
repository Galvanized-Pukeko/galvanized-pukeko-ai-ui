<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import PkButton from './PkButton.vue'
  import PkInput from './PkInput.vue'
  import { chatService } from '../services/chatService'
  
  const messages = ref<Array<{ id: number | string, text: string, sender: 'user' | 'ai' }>>([])
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
      
      // Extract text from response
      // The response structure has content.parts array
      const aiText = response.content.parts.map(p => p.text).join('\n')
      
      messages.value.push({
        id: response.id,
        text: aiText,
        sender: 'ai'
      })
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
  <div class="chat-interface">
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
  </div>
</template>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #e5e7eb;
  background: #fff;
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

.input-area {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
  background: #fff;
}
</style>
