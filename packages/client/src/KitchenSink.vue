<script setup lang="ts">
import { ref } from 'vue'
import PkForm from './components/PkForm.vue'
import PkInput from './components/PkInput.vue'
import PkCheckbox from './components/PkCheckbox.vue'
import PkRadio from './components/PkRadio.vue'
import PkSelect from './components/PkSelect.vue'
import PkButton from './components/PkButton.vue'
import PkInputCounter from './components/PkInputCounter.vue'
import PkBarChart from './components/PkBarChart.vue'
import PkPieChart from './components/PkPieChart.vue'

// Component values
const inputValue = ref('')
const numberValue = ref(0)
const checkboxValue1 = ref(false)
const checkboxValue2 = ref(false)
const radioValue = ref('option1')
const selectValue = ref('')
const counterValue = ref(0)

// Chart data
const barChartData = ref({
  labels: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'],
  datasets: [{
    label: 'Tasks Completed',
    data: [245, 189, 312, 156, 203, 278],
    backgroundColor: [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#06b6d4'
    ]
  }]
})

const pieChartData = ref({
  labels: ['Desktop', 'Mobile', 'Tablet', 'Smart TV', 'Other'],
  datasets: [{
    label: 'Device Usage',
    data: [45, 32, 15, 6, 2],
    backgroundColor: [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#8b5cf6'
    ]
  }]
})

// Form submission handler
const handleFormSubmit = (event: Event) => {
  event.preventDefault()
  alert('Form submitted! Check console for values.')
  console.log('Form Values:', {
    input: inputValue.value,
    number: numberValue.value,
    checkbox1: checkboxValue1.value,
    checkbox2: checkboxValue2.value,
    radio: radioValue.value,
    select: selectValue.value,
    counter: counterValue.value
  })
}

// Button click handler
const handleButtonClick = () => {
  alert('Button clicked!')
}
</script>

<template>
  <div class="app">
    <h1>Pukeko UI Component Kitchen Sink</h1>
    <p class="form-info">A showcase of all available components without external dependencies</p>

    <PkForm @submit="handleFormSubmit" class="dynamic-form">
      <div class="form-group input-group">
        <PkInput
          :modelValue="inputValue"
          @update:modelValue="(val: string | number) => inputValue = String(val)"
          inputId="standardInput"
          placeholder="Enter some text"
          label="Input label"
        />
      </div>

      <div class="form-group counter-group">
        <PkInputCounter
          :modelValue="counterValue"
          @update:modelValue="(val: string | number) => counterValue = Number(val)"
          inputId="counterInput"
          placeholder="0"
          label="Counter Input label"
        />
      </div>

      <div class="form-group checkbox-group">
        <PkCheckbox
          :modelValue="checkboxValue1"
          @update:modelValue="(val: boolean) => checkboxValue1 = val"
          checkboxId="tc"
          label="Checkbox label, i.e. to confirm acceptance of Terms and Conditions"
        />
        <PkCheckbox
          :modelValue="checkboxValue2"
          @update:modelValue="(val: boolean) => checkboxValue2 = val"
          checkboxId="too"
          label="tick this too :)"
        />
      </div>

      <h2>Select one option, i.e. for payment type</h2>
      <div class="form-group radio-group">
        <PkRadio
          :modelValue="radioValue"
          @update:modelValue="(val: string | number) => radioValue = String(val)"
          name="options"
          value="option1"
          label="Radio Label for option 1"
        />
        <PkRadio
          :modelValue="radioValue"
          @update:modelValue="(val: string | number) => radioValue = String(val)"
          name="options"
          value="option2"
          label="Radio Label for option 2"
        />
        <PkRadio
          :modelValue="radioValue"
          @update:modelValue="(val: string | number) => radioValue = String(val)"
          name="options"
          value="option3"
          label="Radio Label for option 3"
        />
      </div>

      <div class="form-group input-group">
        <PkSelect
          :modelValue="selectValue"
          @update:modelValue="(val: string | number) => selectValue = String(val)"
          selectId="justSelect"
          label="Assortment options"
        >
          <option value="">Select an option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </PkSelect>
      </div>

      <h2>Range of buttons</h2>

      <div class="form-group">

        <PkButton
          type="submit"
          class="pk-button-normal-size pk-button-prim"
          >
            Submit Form
        </PkButton>

        <PkButton
          type="submit"
          class="pk-button-normal-size pk-button-sec"
          >
            Submit Form
        </PkButton>

      </div>

      <div class="form-group">

        <PkButton
          type="submit"
          class="pk-button-normal-size pk-button-no-border"
          >
            Submit Form
        </PkButton>

        <PkButton
          type="submit"
          class="pk-button--disabled"
          >
            Submit Form
        </PkButton>

      </div>

      <div class="form-group">
        <PkButton
          type="submit"
          class="pk-button-full-size pk-button-prim"
          >
            Submit Form
        </PkButton>
      </div>

      <div class="form-group">
        <PkButton
          type="submit"
          class="pk-button-full-size pk-button-sec"
          >
            Submit Form
        </PkButton>
      </div>

    </PkForm>

    <h2>Chart Components</h2>

    <div class="chart-section">
      <h3>Department Task Completion - Bar Chart</h3>
      <PkBarChart
        :data="barChartData"
        title="Tasks Completed by Department"
      />
    </div>

    <div class="chart-section">
      <h3>Device Usage Distribution - Pie Chart</h3>
      <PkPieChart
        :data="pieChartData"
        title="User Device Preferences (%)"
      />
    </div>

    <div class="chart-section">
      <h3>Device Usage Distribution - Doughnut Chart</h3>
      <PkPieChart
        :data="pieChartData"
        title="User Device Preferences (Doughnut)"
        type="doughnut"
      />
    </div>

  </div>
</template>

<style scoped>
/* See packages/client/src/assets/global.css for global styles */
/* Place only things specific to KitchenSink here */

.chart-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.chart-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #374151;
}
</style>
