<script setup lang="ts">
import { ref } from 'vue'
import {
  PkForm,
  PkInput,
  PkCheckbox,
  PkRadio,
  PkSelect,
  PkButton,
  PkInputCounter,
  PkBarChart,
  PkPieChart,
  PkNavHeader,
  PkLogo,
  PkTable
} from '@galvanized-pukeko/vue-ui'

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
  datasets: [
    {
      label: 'Tasks Completed',
      data: [245, 189, 312, 156, 203, 278],
      backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
    },
  ],
})

const pieChartData = ref({
  labels: ['Desktop', 'Mobile', 'Tablet', 'Smart TV', 'Other'],
  datasets: [
    {
      label: 'Device Usage',
      data: [45, 32, 15, 6, 2],
      backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    },
  ],
})

// Table data
const tableCaption = ref('Table striped with heading row. And with caption underneath.')
const tableHeader = ref(['Band', 'Year formed', 'No. of Albums', 'Most famous song'])
const tableData = ref([
  ['Stiff Little Fingers', '1977', '10', 'Suspect Device'],
  ['The Stranglers', '1974', '17', 'No More Heroes'],
  ['The Clash', '1976', '6', 'London Calling'],
  ['The Damned', '1976', '11', 'New Rose'],
])
const tableFooter = ref(['', 'Total albums', '44', ''])

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
    counter: counterValue.value,
  })
}
</script>

<template>
  <div class="app">
    <PkNavHeader>
      <template #logo>
        <PkLogo />
      </template>
      <template #nav-links>
        <button class="nav-link">Company</button>
        <button class="nav-link">Catalogue</button>
        <button class="nav-link">Stores</button>
      </template>
      <template #nav-controls>
        <a href="#" class="nav-control nav-control-search">
          <span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 3C15.4183 3 19 6.58172 19 11C19 12.939 18.3088 14.7158 17.1611 16.1006L21.7637 20.7031C21.8418 20.7812 21.8418 20.9082 21.7637 20.9863L20.9863 21.7637C20.9082 21.8418 20.7812 21.8418 20.7031 21.7637L16.1006 17.1611C14.7158 18.3088 12.939 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3ZM11 4.54883C7.43687 4.54883 4.54883 7.43687 4.54883 11C4.54883 14.5631 7.43687 17.4512 11 17.4512C14.5631 17.4512 17.4512 14.5631 17.4512 11C17.4512 7.43687 14.5631 4.54883 11 4.54883Z" fill="black"/>
            </svg>
          </span>
        </a>
        <a href="#" class="nav-control nav-control-cart">
          <span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.9998 2.25C13.9868 2.25 15.6123 3.79552 15.741 5.75H18.3259C18.7705 5.75022 19.1514 6.05784 19.2507 6.4834L19.2664 6.57031L21.2117 20.6699C21.2904 21.2408 20.8465 21.75 20.2703 21.75H3.72925C3.15314 21.7498 2.70914 21.2407 2.78784 20.6699L4.73315 6.57031L4.74878 6.4834C4.84804 6.0579 5.22909 5.75037 5.67358 5.75H8.25854C8.3872 3.79559 10.0128 2.25015 11.9998 2.25ZM4.36011 20.25H19.6394L17.8464 7.25H15.7498V9.5H14.2498V7.25H9.74976V9.5H8.24976V7.25H6.15308L4.36011 20.25ZM11.9998 3.75C10.8418 3.75014 9.88879 4.62514 9.7644 5.75H14.2351C14.1107 4.62508 13.1578 3.75 11.9998 3.75Z" fill="black"/>
            </svg>
          </span>
        </a>
        <div class="nav-control nav-control-currency">
          <PkSelect
            :modelValue="selectValue"
            @update:modelValue="(val: string | number) => (selectValue = String(val))"
            selectId="currencySelect"
            label=""
            class="select-control"
          >
            <option value="USD">USD</option>
            <option value="AUD">AUD</option>
            <option value="NZD">NZD</option>
          </PkSelect>
        </div>
        <a href="#" class="nav-control nav-control-profile">
          <span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 13.25C16.7279 13.25 19.75 16.2721 19.75 20V20.7998C19.75 21.3245 19.3245 21.75 18.7998 21.75H5.2002C4.67552 21.75 4.25 21.3245 4.25 20.7998V20C4.25 16.2721 7.27208 13.25 11 13.25H13ZM11 14.75C8.10051 14.75 5.75 17.1005 5.75 20V20.25H18.25V20C18.25 17.1005 15.8995 14.75 13 14.75H11ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25ZM12 3.75C10.2051 3.75 8.75 5.20507 8.75 7C8.75 8.79493 10.2051 10.25 12 10.25C13.7949 10.25 15.25 8.79493 15.25 7C15.25 5.20507 13.7949 3.75 12 3.75Z" fill="black"/>
            </svg>
          </span>
        </a>
      </template>
    </PkNavHeader>
    <h1>Pukeko UI Component Kitchen Sink</h1>
    <p class="form-info">A showcase of all available components without external dependencies</p>

    <PkForm @submit="handleFormSubmit" class="dynamic-form">
      <div class="form-group input-group">
        <PkInput
          :modelValue="inputValue"
          @update:modelValue="(val: string | number) => (inputValue = String(val))"
          inputId="standardInput"
          placeholder="Enter some text"
          label="Input label"
        />
      </div>

      <div class="form-group counter-group">
        <PkInputCounter
          :modelValue="counterValue"
          @update:modelValue="(val: string | number) => (counterValue = Number(val))"
          inputId="counterInput"
          placeholder="0"
          label="Counter Input label"
        />
      </div>

      <div class="form-group checkbox-group">
        <PkCheckbox
          :modelValue="checkboxValue1"
          @update:modelValue="(val: boolean) => (checkboxValue1 = val)"
          checkboxId="tc"
          label="Checkbox label, i.e. to confirm acceptance of Terms and Conditions"
        />
        <PkCheckbox
          :modelValue="checkboxValue2"
          @update:modelValue="(val: boolean) => (checkboxValue2 = val)"
          checkboxId="too"
          label="tick this too :)"
        />
      </div>

      <h2>Select one option, i.e. for payment type</h2>
      <div class="form-group radio-group">
        <PkRadio
          :modelValue="radioValue"
          @update:modelValue="(val: string | number) => (radioValue = String(val))"
          name="options"
          value="option1"
          label="Radio Label for option 1"
        />
        <PkRadio
          :modelValue="radioValue"
          @update:modelValue="(val: string | number) => (radioValue = String(val))"
          name="options"
          value="option2"
          label="Radio Label for option 2"
        />
        <PkRadio
          :modelValue="radioValue"
          @update:modelValue="(val: string | number) => (radioValue = String(val))"
          name="options"
          value="option3"
          label="Radio Label for option 3"
        />
      </div>

      <div class="form-group input-group">
        <PkSelect
          :modelValue="selectValue"
          @update:modelValue="(val: string | number) => (selectValue = String(val))"
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
        <PkButton type="submit" class="pk-button-normal-size pk-button-prim">
          Submit Form
        </PkButton>

        <PkButton type="submit" class="pk-button-normal-size pk-button-sec"> Submit Form </PkButton>
      </div>

      <div class="form-group">
        <PkButton type="submit" class="pk-button-normal-size pk-button-no-border">
          Submit Form
        </PkButton>

        <PkButton type="submit" class="pk-button--disabled"> Submit Form </PkButton>
      </div>

      <div class="form-group">
        <PkButton type="submit" class="pk-button-full-size pk-button-prim"> Submit Form </PkButton>
      </div>

      <div class="form-group">
        <PkButton type="submit" class="pk-button-full-size pk-button-sec"> Submit Form </PkButton>
      </div>
    </PkForm>

    <h2>Chart Components</h2>

    <div class="chart-section component-section">
      <h3>Department Task Completion - Bar Chart</h3>
      <PkBarChart :data="barChartData" title="Tasks Completed by Department" />
    </div>

    <div class="chart-section component-section">
      <h3>Device Usage Distribution - Pie Chart</h3>
      <PkPieChart :data="pieChartData" title="User Device Preferences (%)" />
    </div>

    <div class="chart-section component-section">
      <h3>Device Usage Distribution - Doughnut Chart</h3>
      <PkPieChart :data="pieChartData" title="User Device Preferences (Doughnut)" type="doughnut" />
    </div>

    <div class="component-section">
      <h3>Range of tables</h3>
      <PkTable
        class="pk-table-normal"
        :caption="tableCaption"
        :header="tableHeader"
        :data="tableData"
        :footer="tableFooter"
      />
    </div>
  </div>
</template>

<style scoped>
/* See packages/client/src/assets/global.css for global styles */
/* Place only things specific to KitchenSink here */

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
}

.nav-link:hover {
  background: var(--bg-button-nob-active, #f3f4f6);
  border: var(--border-button-nob-active, 1px solid #d1d5db);
  color: var(--text-button-nob-active, #111827);
}

.nav-control {
  padding: var(--padding-third, 0.5rem) var(--padding-twothird, 1rem);
  background: var(--bg-button-nob-idle, #fff);
  border: 1px solid transparent;
  border-radius: var(--border-radius-small-box, 4px);
  color: var(--text-button-nob-idle, #374151);
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: var(--transition-normal, all 0.2s);
}

.nav-control:hover {
  background: var(--bg-button-nob-active, #f3f4f6);
  border: var(--border-button-nob-active, 1px solid #d1d5db);
  color: var(--text-button-nob-active, #111827);
}
</style>
