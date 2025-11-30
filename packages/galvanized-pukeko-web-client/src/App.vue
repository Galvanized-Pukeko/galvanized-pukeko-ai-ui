<script setup lang="ts">
import {ref, onMounted, onUnmounted, markRaw} from 'vue'
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
import PkNavHeader from './components/PkNavHeader.vue'
import PkLogo from './components/PkLogo.vue'
import PkNavItem from './components/PkNavItem.vue'
import {configService, UiConfig} from './services/configService';
import {
  connectionService,
  type ConnectionStatus,
  type ComponentConfig,
  type WebSocketMessage
} from './services/connectionService'

const uiConfig = ref<UiConfig | null>(configService.get())
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
}>({input: {}, checkbox: {}, radio: {}, select: {}, counter: {}})

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
  nav: PkNavHeader,
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return {...baseProps, ...modelProps, value: 'option1'}
  }

  return {...baseProps, ...modelProps}
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
    // Clear other content types to allow this form to be displayed
    currentChart.value = null
    currentTable.value = null

    serverComponents.value = message.components
    formLabels.value = {
      submitLabel: message.submitLabel,
      cancelLabel: message.cancelLabel
    }
    // Reset form values when new components arrive
    componentValues.value = {input: {}, checkbox: {}, radio: {}, select: {}, counter: {}}

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
    // Clear other content types to allow this chart to be displayed
    currentTable.value = null
    serverComponents.value = []

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
    // Clear other content types to allow this table to be displayed
    currentChart.value = null
    serverComponents.value = []

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
  componentValues.value = {input: {}, checkbox: {}, radio: {}, select: {}, counter: {}}

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

onMounted(() => {
  if (uiConfig.value?.pageTitle) {
    document.title = uiConfig.value.pageTitle
  }

  connectionService.connect()

  unsubscribeStatus = connectionService.subscribeToStatus((status) => {
    wsStatus.value = status
  })

  unsubscribeMessage = connectionService.subscribeToMessage('form', handleRenderComponents)
  unsubscribeChartMessage = connectionService.subscribeToMessage('chart', handleChartMessage)
  unsubscribeTableMessage = connectionService.subscribeToMessage('table', handleTableMessage)
});

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
});
</script>

<template>
  <div class="app-container">
    <!-- Header -->
    <header id="galvanized-pukeko-ui-nav-header" class="app-header">
      <PkNavHeader>
        <template #logo>
          <PkNavItem
            v-if="uiConfig?.logo"
            :text="uiConfig.logo.text"
            :href="uiConfig.logo.href"
            :img="uiConfig.logo.img"
          />
          <PkLogo v-else/>
        </template>
        <template #nav-links>
          <template v-if="uiConfig?.header">
            <PkNavItem
              v-for="(item, index) in uiConfig.header"
              :key="index"
              :text="item.text"
              :href="item.href"
              :img="item.img"
              class="nav-link-item"
            />
          </template>
        </template>
        <template #nav-controls>
          <div class="status">
                <span :class="['status-badge', `status-${wsStatus}`]">
                  WebSockets {{ wsStatus }}
                </span>
          </div>
        </template>
      </PkNavHeader>
    </header>

    <!-- Main layout with sidebars and content -->
    <div class="app-main-layout">
      <!-- Left Sidebar -->
      <aside id="galvanized-pukeko-ui-nav-left-sidebar" class="app-left-sidebar">
        <!-- Empty by default -->
      </aside>

      <!-- Main Content Area -->
      <main class="app-main-content">
        <div class="split-screen">
          <!-- Left Side: Chat Interface -->
          <div class="chat-panel">
            <ChatInterface/>
          </div>

          <!-- Right Side: Form/Content -->
          <div class="content-panel">
            <div class="app-content">
              <!-- Show only one section at a time: waiting message, form, chart, or table -->
              <div v-if="!currentChart && !currentTable && serverComponents.length === 0"
                   id="galvanized-pukeko-ui-waiting-placeholder"
                   class="waiting-placeholder">
                <PkLogo />
              </div>

              <PkForm v-else-if="!currentChart && !currentTable && serverComponents.length > 0"
                      @submit="handleSubmit" class="dynamic-form">
                <h2>Server-Requested Form</h2>
                <p class="form-info">server-rendered form</p>

                <div v-for="(component, index) in serverComponents.filter(c => c.type !== 'button')"
                     :key="`${component.type}_${index}`" class="form-group">
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
            <!--button @click="sendMessage">send message</button-->
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <aside id="galvanized-pukeko-ui-nav-right-sidebar" class="app-right-sidebar">
        <!-- Empty by default -->
      </aside>
    </div>

    <!-- Footer -->
    <footer id="galvanized-pukeko-ui-nav-footer" class="app-footer">
      <div v-if="uiConfig?.footer" class="footer-content">
        <PkNavItem
          v-for="(item, index) in uiConfig.footer"
          :key="index"
          :text="item.text"
          :href="item.href"
          :img="item.img"
          class="footer-item"
        />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* See packages/client/src/assets/global.css for global styles */
/* Place only things specific to DevSite here */

.app-container {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}

.app-header {
  grid-row: 1;
  z-index: 100;
}

.app-main-layout {
  grid-row: 2;
  display: grid;
  grid-template-columns: auto 1fr auto;
  overflow: hidden;
}

.app-left-sidebar {
  grid-column: 1;
  overflow-y: auto;
  /* Empty by default, will take no space unless content is added */
}

.app-left-sidebar:empty {
  display: none;
}

.app-main-content {
  grid-column: 2;
  overflow: hidden;
}

.app-right-sidebar {
  grid-column: 3;
  overflow-y: auto;
  /* Empty by default, will take no space unless content is added */
}

.app-right-sidebar:empty {
  display: none;
}

.app-footer {
  grid-row: 3;
  background-color: var(--bg-input-idle);
  border-top: var(--line-separator-subtle);
}

.app-footer:empty {
  display: none;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--padding-twothird);
  padding: var(--padding-third);
  height: calc(var(--padding-twothird) * 3);
}

.footer-item {
  color: var(--text-button-sec-idle);
}

.nav-link-item {
  padding: var(--padding-third) var(--padding-twothird);
  border-radius: var(--border-radius-small-box);
  transition: var(--transition-normal);
}

.nav-link-item:hover {
  background: var(--bg-button-nob-active);
  color: var(--text-button-nob-active);
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

.nav-link {
  padding: var(--padding-third, 0.5rem) var(--padding-twothird, 1rem);
  text-decoration: none;
  color: var(--text-button-sec-idle, #374151);
  border-radius: var(--border-radius-small-box, 4px);
  transition: var(--transition-normal, all 0.2s);
  cursor: pointer;
  border: 1px solid transparent;
  font-size: 1rem;
  font-family: inherit;
  background: none;
  display: inline-block;
}

.nav-link:hover {
  background: var(--bg-button-nob-active, #f3f4f6);
  border: var(--border-button-nob-active, 1px solid #d1d5db);
  color: var(--text-button-nob-active, #111827);
}

.waiting-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40%;
  margin: 0 auto;
  opacity: 0.1;
  padding: 2rem 0;
}

.waiting-placeholder :deep(svg) {
  width: 100%;
}
</style>
