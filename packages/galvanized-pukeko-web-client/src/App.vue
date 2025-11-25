<script setup lang="ts">
import { ref, onMounted, onUnmounted, markRaw } from 'vue'
import PkForm from './components/PkForm.vue'
import PkInput from './components/PkInput.vue'
import PkCheckbox from './components/PkCheckbox.vue'
import PkRadio from './components/PkRadio.vue'
import PkSelect from './components/PkSelect.vue'
import PkButton from './components/PkButton.vue'
import PkInputCounter from './components/PkInputCounter.vue'
import PkBarChart from './components/PkBarChart.vue'
import PkPieChart from './components/PkPieChart.vue'
import PkTable from './components/PkTable.vue'
import ChatInterface from './components/ChatInterface.vue'
import PkNav from './components/PkNav.vue'
import { connectionService, type ConnectionStatus, type ComponentConfig, type WebSocketMessage } from './services/connectionService'

const serverComponents = ref<ComponentConfig[]>([])
const formLabels = ref<{ submitLabel?: string; cancelLabel?: string }>({})
const wsStatus = ref<ConnectionStatus>('disconnected')
const currentChart = ref<{
  type: 'bar' | 'pie'
  title: string
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string[]
      borderColor?: string[]
      borderWidth?: number
    }[]
  }
} | null>(null)
const currentTable = ref<{
  caption?: string
  header?: string[]
  data: string[][]
  footer?: string[]
} | null>(null)
const componentValues = ref<{
  input: Record<string, string>
  checkbox: Record<string, boolean>
  radio: Record<string, string>
  select: Record<string, string>
  counter: Record<string, string>
}>({ input: {}, checkbox: {}, radio: {}, select: {}, counter: {} })

/**
 * This is going to be coming from config in future.
 */
const componentMap = markRaw({
  input: PkInput,
  checkbox: PkCheckbox,
  radio: PkRadio,
  select: PkSelect,
  button: PkButton,
  counter: PkInputCounter,
  nav: PkNav,
  table: PkTable
})

/**
 * Centralized component type configuration
 * Defines how each component type should be initialized and which value store to use
 */
const componentTypeConfig: Record<string, {
  valueStore: keyof typeof componentValues.value
  defaultValue: (comp: ComponentConfig) => string | boolean
}> = {
  input: {
    valueStore: 'input',
    defaultValue: (comp) => comp.value || ''
  },
  checkbox: {
    valueStore: 'checkbox',
    defaultValue: () => false
  },
  radio: {
    valueStore: 'radio',
    defaultValue: (comp) => comp.value || 'option1'
  },
  select: {
    valueStore: 'select',
    defaultValue: (comp) => comp.value || ''
  },
  counter: {
    valueStore: 'input',
    defaultValue: (comp) => comp.value || ''
  }
}

/**
 * Component rendering configuration
 * Defines how each component type should be rendered with its props
 */
const getComponentProps = (component: ComponentConfig, index: number): Record<string, any> | null => {
  const key = component.label || `${component.type}_${index}`
  const config = componentTypeConfig[component.type]
  
  if (!config) return null
  
  const valueStore = componentValues.value[config.valueStore]
  
  const baseProps = {
    name: component.label,
    placeholder: component.label,
    label: component.label
  }
  
  const modelProps = {
    modelValue: valueStore[key],
    'onUpdate:modelValue': (val: string | number | boolean) => {
      if (config.valueStore === 'checkbox') {
        valueStore[key] = val as never
      } else {
        valueStore[key] = String(val) as never
      }
    }
  }
  
  // Special handling for specific component types
  if (component.type === 'radio') {
    return { ...baseProps, ...modelProps, value: 'option1' }
  }
  
  return { ...baseProps, ...modelProps }
}

/**
 * Type-safe component map accessor
 */
const getComponent = (type: string) => {
  return componentMap[type as keyof typeof componentMap]
}

let unsubscribeStatus: (() => void) | null = null
let unsubscribeMessage: (() => void) | null = null
let unsubscribeChartMessage: (() => void) | null = null
let unsubscribeTableMessage: (() => void) | null = null

// This all is really bad stuff and has to be refactored
const handleRenderComponents = (message: WebSocketMessage) => {
  console.log('Received message from server:', message)
  if (message.components) {
    serverComponents.value = message.components
    formLabels.value = {
      submitLabel: message.submitLabel,
      cancelLabel: message.cancelLabel
    }
    // Reset form values when new components arrive
    componentValues.value = { input: {}, checkbox: {}, radio: {}, select: {}, counter: {} }

    message.components.forEach((comp, index) => {
      const key = comp.label || `${comp.type}_${index}`
      const config = componentTypeConfig[comp.type]
      
      if (config) {
        const valueStore = componentValues.value[config.valueStore]
        valueStore[key] = config.defaultValue(comp) as never
      }
    })
  }
}

const handleChartMessage = (message: WebSocketMessage) => {
  console.log('Received chart message from server:', message)
  // Cast to expected chart message structure
  const chartMessage = message as unknown as {
    chartType: 'bar' | 'pie'
    title: string
    data: {
      labels: string[]
      datasets: {
        label: string
        data: number[]
        backgroundColor?: string[]
        borderColor?: string[]
        borderWidth?: number
      }[]
    }
  }

  if (chartMessage.chartType && chartMessage.title && chartMessage.data) {
    currentChart.value = {
      type: chartMessage.chartType,
      title: chartMessage.title,
      data: chartMessage.data
    }
  }
}

const handleTableMessage = (message: WebSocketMessage) => {
  console.log('Received table message from server:', message)
  // Cast to expected table message structure
  const tableMessage = message as unknown as {
    caption?: string
    header?: string[]
    data: string[][]
    footer?: string[]
  }

  if (tableMessage.data) {
    currentTable.value = {
      caption: tableMessage.caption,
      header: tableMessage.header,
      data: tableMessage.data,
      footer: tableMessage.footer
    }
  }
}

const handleSubmit = (event: Event) => {
  event.preventDefault()
  const allValues: Record<string, string | boolean | number> = {
    ...componentValues.value.input,
    ...componentValues.value.checkbox,
    ...componentValues.value.radio,
    ...componentValues.value.select,
    ...componentValues.value.counter
  }
  console.log('Form submitted with values:', allValues)

  // Send form submission to server
  connectionService.sendMessage({
    type: 'form_submit',
    data: allValues,
    timestamp: Date.now()
  })
}

const handleCancel = () => {
  // Clear all form values
  componentValues.value = { input: {}, checkbox: {}, radio: {}, select: {}, counter: {} }

  // Reset values based on current components
  serverComponents.value = [];

  // Send cancel message to server
  connectionService.sendMessage({
    type: 'cancel',
    timestamp: Date.now()
  })
}

const handleClearChart = () => {
  // Clear the current chart
  currentChart.value = null

  // Send cancel message to server (similar to form cancel)
  connectionService.sendMessage({
    type: 'cancel',
    timestamp: Date.now()
  })
}

const handleClearTable = () => {
  // Clear the current table
  currentTable.value = null

  // Send cancel message to server
  connectionService.sendMessage({
    type: 'cancel',
    timestamp: Date.now()
  })
}

const sendMessage = () => {
  connectionService.sendMessage({
    jsonrpc: '2.0',
    method: 'cancel',
    type: 'cancel',
    timestamp: Date.now(),
    id: crypto.randomUUID()
  })
};

onMounted(() => {
  connectionService.connect()

  unsubscribeStatus = connectionService.subscribeToStatus((status) => {
    wsStatus.value = status
  })

  unsubscribeMessage = connectionService.subscribeToMessage('form', handleRenderComponents)
  unsubscribeChartMessage = connectionService.subscribeToMessage('chart', handleChartMessage)
  unsubscribeTableMessage = connectionService.subscribeToMessage('table', handleTableMessage)
})

onUnmounted(() => {
  if (unsubscribeStatus) {
    unsubscribeStatus()
  }
  if (unsubscribeMessage) {
    unsubscribeMessage()
  }
  if (unsubscribeChartMessage) {
    unsubscribeChartMessage()
  }
  if (unsubscribeTableMessage) {
    unsubscribeTableMessage()
  }
  connectionService.disconnect()
})
</script>

<template>
  <div class="app-container">
    <div class="split-screen">
      <!-- Left Side: Chat Interface -->
      <div class="chat-panel">
        <ChatInterface />
      </div>

      <!-- Right Side: Form/Content -->
      <div class="content-panel">
        <div class="app-content">
          <h1>Pukeko UI Components Demo</h1>

          <div class="status">
            WebSocket Status:
            <span :class="['status-badge', `status-${wsStatus}`]">
              {{ wsStatus }}
            </span>
          </div>

          <!-- Show only one section at a time: waiting message, form, chart, or table -->
          <div v-if="!currentChart && !currentTable && serverComponents.length === 0" class="info">
            Waiting for server to send components...
          </div>

          <PkForm v-else-if="!currentChart && !currentTable && serverComponents.length > 0" @submit="handleSubmit" class="dynamic-form">
            <h2>Server-Requested Form</h2>
            <p class="form-info">server-rendered form</p>

            <div v-for="(component, index) in serverComponents.filter(c => c.type !== 'button')" :key="`${component.type}_${index}`" class="form-group">
              <!-- Select component needs special handling for options -->
              <template v-if="component.type === 'select'">
                <label>{{ component.label }}:</label>
                <component
                  :is="getComponent(component.type)"
                  v-bind="getComponentProps(component, index)"
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
              </template>
              
              <!-- All other components use the same pattern -->
              <component
                v-else
                :is="getComponent(component.type)"
                v-bind="getComponentProps(component, index)"
              />
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

          <!-- Chart rendering section -->
          <div v-else-if="currentChart && !currentTable" class="chart-section">
            <h2>Server-Requested Chart</h2>
            <PkBarChart
              v-if="currentChart.type === 'bar'"
              :data="currentChart.data"
              :title="currentChart.title"
            />
            <PkPieChart
              v-if="currentChart.type === 'pie'"
              :data="currentChart.data"
              :title="currentChart.title"
            />
            <div class="chart-buttons">
              <PkButton type="button" @click="handleClearChart">
                Clear
              </PkButton>
            </div>
          </div>

          <!-- Table rendering section -->
          <div v-else-if="currentTable" class="table-section">
            <h2>Server-Requested Table</h2>
            <PkTable
              :caption="currentTable.caption"
              :header="currentTable.header"
              :data="currentTable.data"
              :footer="currentTable.footer"
            />
            <div class="table-buttons">
              <PkButton type="button" @click="handleClearTable">
                Clear
              </PkButton>
            </div>
          </div>
        </div>
        <button @click="sendMessage">send message</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* See packages/client/src/assets/global.css for global styles */
/* Place only things specific to DevSite here */

.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.split-screen {
  display: flex;
  height: 100%;
  width: 100%;
}

.chat-panel {
  width: 40%;
  height: 100%;
  min-width: 300px;
}

.content-panel {
  width: 60%;
  height: 100%;
  overflow-y: auto;
  background-color: #f9fafb;
}

.app-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.chart-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.chart-section h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #374151;
}

.chart-buttons {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.table-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.table-section h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #374151;
}

.table-buttons {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}
</style>
