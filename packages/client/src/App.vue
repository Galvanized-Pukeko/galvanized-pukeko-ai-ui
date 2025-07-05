<script setup lang="ts">
import { ref, onMounted, onUnmounted, markRaw } from 'vue'
import PkForm from './components/PkForm.vue'
import PkInput from './components/PkInput.vue'
import PkCheckbox from './components/PkCheckbox.vue'
import PkRadio from './components/PkRadio.vue'
import PkSelect from './components/PkSelect.vue'
import PkButton from './components/PkButton.vue'
import { connectionService, type ConnectionStatus, type ComponentConfig, type WebSocketMessage } from './services/connectionService'

const serverComponents = ref<ComponentConfig[]>([])
const formLabels = ref<{ submitLabel?: string; cancelLabel?: string }>({})
const wsStatus = ref<ConnectionStatus>('disconnected')
const componentValues = ref<{
  input: Record<string, string>
  checkbox: Record<string, boolean>
  radio: Record<string, string>
  select: Record<string, string>
}>({ input: {}, checkbox: {}, radio: {}, select: {} })

/**
 * This is going to be coming from config in future.
 */
const componentMap = markRaw({
  input: PkInput,
  checkbox: PkCheckbox,
  radio: PkRadio,
  select: PkSelect,
  button: PkButton
})

let unsubscribeStatus: (() => void) | null = null
let unsubscribeMessage: (() => void) | null = null

const handleRenderComponents = (message: WebSocketMessage) => {
  console.log('Received message from server:', message)
  if (message.components) {
    serverComponents.value = message.components
    formLabels.value = {
      submitLabel: message.submitLabel,
      cancelLabel: message.cancelLabel
    }
    // Reset form values when new components arrive
    componentValues.value = { input: {}, checkbox: {}, radio: {}, select: {} }

    message.components.forEach((comp, index) => {
      const key = comp.label || `${comp.type}_${index}`
      switch (comp.type) {
        case 'input':
          componentValues.value.input[key] = comp.value || ''
          break
        case 'checkbox':
          componentValues.value.checkbox[key] = false
          break
        case 'radio':
          componentValues.value.radio[key] = comp.value || 'option1'
          break
        case 'select':
          componentValues.value.select[key] = comp.value || ''
          break
      }
    })
  }
}

const handleSubmit = (event: Event) => {
  event.preventDefault()
  const allValues: Record<string, string | boolean | number> = {
    ...componentValues.value.input,
    ...componentValues.value.checkbox,
    ...componentValues.value.radio,
    ...componentValues.value.select
  }
  console.log('Form submitted with values:', allValues)
}

const handleCancel = () => {
  // Clear all form values
  componentValues.value = { input: {}, checkbox: {}, radio: {}, select: {} }

  // Reset values based on current components
  serverComponents.value = [];
  
  // Send cancel message to server
  connectionService.sendMessage({
    type: 'cancel',
    timestamp: Date.now()
  })
}

onMounted(() => {
  connectionService.connect()

  unsubscribeStatus = connectionService.subscribeToStatus((status) => {
    wsStatus.value = status
  })

  unsubscribeMessage = connectionService.subscribeToMessage('form', handleRenderComponents)
})

onUnmounted(() => {
  if (unsubscribeStatus) {
    unsubscribeStatus()
  }
  if (unsubscribeMessage) {
    unsubscribeMessage()
  }
  connectionService.disconnect()
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
      <p class="form-info">server-rendered form</p>

      <div v-for="(component, index) in serverComponents.filter(c => c.type !== 'button')" :key="`${component.type}_${index}`" class="form-group">
        <component
          :is="componentMap[component.type]"
          v-if="component.type === 'input'"
          :modelValue="componentValues.input[component.label || `${component.type}_${index}`]"
          @update:modelValue="(val: string | number) => componentValues.input[component.label || `${component.type}_${index}`] = String(val)"
          :placeholder="component.label"
          :name="component.label"
        />

        <component
          :is="componentMap[component.type]"
          v-else-if="component.type === 'checkbox'"
          :modelValue="componentValues.checkbox[component.label || `${component.type}_${index}`]"
          @update:modelValue="(val: boolean) => componentValues.checkbox[component.label || `${component.type}_${index}`] = val"
          :label="component.label"
          :name="component.label"
        />

        <component
          :is="componentMap[component.type]"
          v-else-if="component.type === 'radio'"
          :modelValue="componentValues.radio[component.label || `${component.type}_${index}`]"
          @update:modelValue="(val: string | number) => componentValues.radio[component.label || `${component.type}_${index}`] = String(val)"
          :name="component.label"
          value="option1"
          :label="component.label"
        />

        <div v-else-if="component.type === 'select'">
          <label>{{ component.label }}:</label>
          <component
            :is="componentMap[component.type]"
            :modelValue="componentValues.select[component.label || `${component.type}_${index}`]"
            @update:modelValue="(val: string | number) => componentValues.select[component.label || `${component.type}_${index}`] = String(val)"
            :name="component.label"
          >
            <option value="">Select an option</option>
            <option
              v-for="option in component.options"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </component>
        </div>
      </div>

      <div class="form-buttons">
        <PkButton type="submit">
          {{ formLabels.submitLabel || 'Submit' }}
        </PkButton>
        <PkButton type="button" @click="handleCancel">
          {{ formLabels.cancelLabel || 'Cancel' }}
        </PkButton>
      </div>
    </PkForm>
  </div>
</template>

<style scoped>
/* See packages/client/src/assets/global.css for global styles */
/* Place only things specific to DevSite here */
</style>
