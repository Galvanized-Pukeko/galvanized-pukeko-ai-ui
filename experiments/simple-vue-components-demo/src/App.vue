<template>
  <div class="demo-app">
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
        <a href="#" class="nav-control nav-control-profile">
          <span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 13.25C16.7279 13.25 19.75 16.2721 19.75 20V20.7998C19.75 21.3245 19.3245 21.75 18.7998 21.75H5.2002C4.67552 21.75 4.25 21.3245 4.25 20.7998V20C4.25 16.2721 7.27208 13.25 11 13.25H13ZM11 14.75C8.10051 14.75 5.75 17.1005 5.75 20V20.25H18.25V20C18.25 17.1005 15.8995 14.75 13 14.75H11ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25ZM12 3.75C10.2051 3.75 8.75 5.20507 8.75 7C8.75 8.79493 10.2051 10.25 12 10.25C13.7949 10.25 15.25 8.79493 15.25 7C15.25 5.20507 13.7949 3.75 12 3.75Z" fill="black"/>
            </svg>
          </span>
        </a>
      </template>
    </PkNavHeader>

    <main class="demo-content">
      <section class="demo-section">
        <h2>Buttons</h2>
        <div class="component-showcase">
          <PkButton @click="handleClick">Primary Button</PkButton>
          <PkButton variant="secondary" @click="handleClick">Secondary Button</PkButton>
          <PkButton disabled>Disabled Button</PkButton>
        </div>
      </section>

      <section class="demo-section">
        <h2>Form Controls</h2>
        <div class="component-showcase">
          <PkInput
            v-model="formData.name"
            label="Name"
            placeholder="Enter your name"
          />

          <PkInput
            v-model="formData.email"
            label="Email"
            type="email"
            placeholder="Enter your email"
          />

          <PkInputCounter
            v-model="formData.count"
            label="Counter"
            :min="0"
            :max="10"
          />

          <PkCheckbox v-model="formData.terms">
            I agree to the terms and conditions
          </PkCheckbox>

          <div class="radio-group">
            <label>Select an option:</label>
            <PkRadio v-model="formData.option" value="option1">
              Option 1
            </PkRadio>
            <PkRadio v-model="formData.option" value="option2">
              Option 2
            </PkRadio>
            <PkRadio v-model="formData.option" value="option3">
              Option 3
            </PkRadio>
          </div>

          <PkSelect
            v-model="formData.country"
            label="Country"
            :options="countryOptions"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Charts</h2>
        <div class="charts-container">
          <div class="chart-wrapper">
            <h3>Bar Chart</h3>
            <PkBarChart
              :data="barChartData"
              :options="{ responsive: true, maintainAspectRatio: true }"
            />
          </div>
          <div class="chart-wrapper">
            <h3>Pie Chart</h3>
            <PkPieChart
              :data="pieChartData"
              :options="{ responsive: true, maintainAspectRatio: true }"
            />
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>Table</h2>
        <PkTable
          :headers="tableHeaders"
          :rows="tableRows"
        />
      </section>

      <section class="demo-section">
        <h2>Form State</h2>
        <pre class="form-state">{{ JSON.stringify(formData, null, 2) }}</pre>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  PkButton,
  PkInput,
  PkCheckbox,
  PkRadio,
  PkSelect,
  PkInputCounter,
  PkBarChart,
  PkPieChart,
  PkTable,
} from '@galvanized-pukeko/vue-ui'

const formData = ref({
  name: '',
  email: '',
  count: 5,
  terms: false,
  option: 'option1',
  country: ''
})

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'nz', label: 'New Zealand' }
]

const barChartData = {
  labels: ['January', 'February', 'March', 'April', 'May'],
  datasets: [{
    label: 'Sales',
    data: [12, 19, 3, 5, 2],
    backgroundColor: 'rgba(75, 192, 192, 0.6)',
    borderColor: 'rgba(75, 192, 192, 1)',
    borderWidth: 1
  }]
}

const pieChartData = {
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
  datasets: [{
    data: [12, 19, 3, 5, 2],
    backgroundColor: [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)'
    ]
  }]
}

const tableHeaders = ['Name', 'Email', 'Role', 'Status']
const tableRows = [
  ['John Doe', 'john@example.com', 'Admin', 'Active'],
  ['Jane Smith', 'jane@example.com', 'User', 'Active'],
  ['Bob Johnson', 'bob@example.com', 'User', 'Inactive'],
  ['Alice Williams', 'alice@example.com', 'Editor', 'Active']
]

const handleClick = () => {
  console.log('Button clicked!')
}
</script>

<style scoped>
.demo-app {
  min-height: 100vh;
  background: #f5f5f5;
}

.demo-header {
  background: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.demo-header h1 {
  margin: 1rem 0 0;
  color: #333;
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.demo-section {
  background: white;
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.demo-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.demo-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #666;
  font-size: 1.1rem;
}

.component-showcase {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.component-showcase > * {
  width: 100%;
  max-width: 400px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-group > label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.chart-wrapper {
  display: flex;
  flex-direction: column;
}

.form-state {
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
}
</style>
