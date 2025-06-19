<script setup lang="ts">
import { ref, onMounted, onUnmounted, markRaw } from 'vue'
import PkForm from './components/PkForm.vue'
import PkInput from './components/PkInput.vue'
import PkCheckbox from './components/PkCheckbox.vue'
import PkRadio from './components/PkRadio.vue'
import PkSelect from './components/PkSelect.vue'
import PkButton from './components/PkButton.vue'

interface ComponentConfig {
  name: string
  label: string
}

interface WebSocketMessage {
  type: string
  components: ComponentConfig[]
}

const serverComponents = ref<ComponentConfig[]>([])
const wsStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
const inputValues = ref<Record<string, string>>({})
const checkboxValues = ref<Record<string, boolean>>({})
const radioValues = ref<Record<string, string>>({})
const selectValues = ref<Record<string, string>>({})

const componentMap = markRaw({
  Input: PkInput,
  Checkbox: PkCheckbox,
  Radio: PkRadio,
  Select: PkSelect,
  Button: PkButton
})

let ws: WebSocket | null = null

const connectWebSocket = () => {
  wsStatus.value = 'connecting'
  ws = new WebSocket('ws://localhost:3001')

  ws.onopen = () => {
    console.log('Connected to WebSocket server')
    wsStatus.value = 'connected'
  }

  ws.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      if (message.type === 'render-components') {
        serverComponents.value = message.components
        // Reset form values when new components arrive
        inputValues.value = {}
        checkboxValues.value = {}
        radioValues.value = {}
        selectValues.value = {}
        
        message.components.forEach((comp, index) => {
          const key = `${comp.name}_${index}`
          switch (comp.name) {
            case 'Input':
              inputValues.value[key] = ''
              break
            case 'Checkbox':
              checkboxValues.value[key] = false
              break
            case 'Radio':
              radioValues.value[key] = 'option1'
              break
            case 'Select':
              selectValues.value[key] = ''
              break
          }
        })
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  ws.onclose = () => {
    console.log('Disconnected from WebSocket server')
    wsStatus.value = 'disconnected'
    // Attempt to reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000)
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

const handleSubmit = (event: Event) => {
  event.preventDefault()
  const allValues: Record<string, any> = {
    ...inputValues.value,
    ...checkboxValues.value,
    ...radioValues.value,
    ...selectValues.value
  }
  console.log('Form submitted with values:', allValues)
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<template>
  <div class="app">
    <h1>Pukeko UI Components Demo</h1>
    
    <div class="status">
      WebSocket Status: 
      <span :class="['status-badge', `status-${wsStatus}`]">
        {{ wsStatus }}
      </span>
    </div>

    <div v-if="serverComponents.length === 0" class="info">
      Waiting for server to send components...
    </div>

    <PkForm v-else @submit="handleSubmit" class="dynamic-form">
      <h2>Server-Requested Form</h2>
      <p class="form-info">Form updates every 10 seconds with new components from server</p>
      
      <div v-for="(component, index) in serverComponents" :key="`${component.name}_${index}`" class="form-group">
        <component
          :is="componentMap[component.name]"
          v-if="component.name === 'Input'"
          :modelValue="inputValues[`${component.name}_${index}`]"
          @update:modelValue="(val: string | number) => inputValues[`${component.name}_${index}`] = String(val)"
          :placeholder="component.label"
        />
        
        <component
          :is="componentMap[component.name]"
          v-else-if="component.name === 'Checkbox'"
          :modelValue="checkboxValues[`${component.name}_${index}`]"
          @update:modelValue="(val: boolean) => checkboxValues[`${component.name}_${index}`] = val"
          :label="component.label"
        />
        
        <component
          :is="componentMap[component.name]"
          v-else-if="component.name === 'Radio'"
          :modelValue="radioValues[`${component.name}_${index}`]"
          @update:modelValue="(val: string | number) => radioValues[`${component.name}_${index}`] = String(val)"
          :name="`radio_${index}`"
          value="option1"
          :label="component.label"
        />
        
        <div v-else-if="component.name === 'Select'">
          <label>{{ component.label }}:</label>
          <component
            :is="componentMap[component.name]"
            :modelValue="selectValues[`${component.name}_${index}`]"
            @update:modelValue="(val: string | number) => selectValues[`${component.name}_${index}`] = String(val)"
          >
            <option value="">Select an option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </component>
        </div>
        
        <component
          :is="componentMap[component.name]"
          v-else-if="component.name === 'Button'"
          type="submit"
        >
          {{ component.label }}
        </component>
      </div>
    </PkForm>
  </div>
</template>

<style scoped>
.app {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 1rem;
}

h2 {
  color: #444;
  margin-bottom: 0.5rem;
}

.status {
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.status-connecting {
  background-color: #ffc107;
  color: #000;
}

.status-connected {
  background-color: #28a745;
  color: #fff;
}

.status-disconnected {
  background-color: #dc3545;
  color: #fff;
}

.info {
  text-align: center;
  padding: 3rem;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.dynamic-form {
  background-color: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
}

.form-info {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-style: italic;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
