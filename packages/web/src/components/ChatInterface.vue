<script setup lang="ts">
import { ref } from 'vue'
import PkButton from './PkButton.vue'
import PkInput from './PkInput.vue'

const messages = ref([
  { id: 1, text: 'Hello! How can I help you today?', sender: 'ai' },
  { id: 2, text: 'I need some help with the form.', sender: 'user' },
  { id: 3, text: 'Sure, what specifically do you need help with?', sender: 'ai' }
])

const newMessage = ref('')

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  messages.value.push({
    id: Date.now(),
    text: newMessage.value,
    sender: 'user'
  })
  
  newMessage.value = ''
  
  // Simulate AI response
  setTimeout(() => {
    messages.value.push({
      id: Date.now() + 1,
      text: 'I see. Let me process that for you.',
      sender: 'ai'
    })
  }, 1000)
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
