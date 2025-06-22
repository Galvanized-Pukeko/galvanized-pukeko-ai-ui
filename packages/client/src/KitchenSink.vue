<script setup lang="ts">
import { ref } from 'vue'
import PkForm from './components/PkForm.vue'
import PkInput from './components/PkInput.vue'
import PkCheckbox from './components/PkCheckbox.vue'
import PkRadio from './components/PkRadio.vue'
import PkSelect from './components/PkSelect.vue'
import PkButton from './components/PkButton.vue'

// Component values
const inputValue = ref('')
const numberValue = ref(0)
const checkboxValue = ref(false)
const radioValue = ref('option1')
const selectValue = ref('')

// Form submission handler
const handleFormSubmit = (event: Event) => {
  event.preventDefault()
  alert('Form submitted! Check console for values.')
  console.log('Form Values:', {
    input: inputValue.value,
    number: numberValue.value,
    checkbox: checkboxValue.value,
    radio: radioValue.value,
    select: selectValue.value
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

    <!-- PkInput Component -->
    <section class="component-section">
      <h2>PkInput Component</h2>
      <div class="component-grid">
        <div class="example-item">
          <div class="example-label">Basic Text Input</div>
          <PkInput
            v-model="inputValue"
            placeholder="Enter text here..."
          />
          <small>Value: {{ inputValue || '(empty)' }}</small>
        </div>

        <div class="example-item">
          <div class="example-label">Number Input</div>
          <PkInput
            v-model="numberValue"
            type="number"
            placeholder="Enter a number..."
          />
          <small>Value: {{ numberValue }}</small>
        </div>
      </div>
    </section>

    <!-- PkCheckbox Component -->
    <section class="component-section">
      <h2>PkCheckbox Component</h2>
      <div class="component-grid">
        <div class="example-item">
          <PkCheckbox
            v-model="checkboxValue"
            label="Accept terms and conditions"
          />
          <small>Checked: {{ checkboxValue }}</small>
        </div>
      </div>
    </section>

    <!-- PkRadio Component -->
    <section class="component-section">
      <h2>PkRadio Component</h2>
      <div class="component-grid">
        <div class="example-item">
          <div class="example-label">Radio Group</div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <PkRadio
              v-model="radioValue"
              name="options"
              value="option1"
              label="Option 1"
            />
            <PkRadio
              v-model="radioValue"
              name="options"
              value="option2"
              label="Option 2"
            />
            <PkRadio
              v-model="radioValue"
              name="options"
              value="option3"
              label="Option 3"
            />
          </div>
          <small>Selected: {{ radioValue }}</small>
        </div>
      </div>
    </section>

    <!-- PkSelect Component -->
    <section class="component-section">
      <h2>PkSelect Component</h2>
      <div class="component-grid">
        <div class="example-item">
          <div class="example-label">Dropdown Select</div>
          <PkSelect v-model="selectValue">
            <option value="">Choose an option...</option>
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
            <option value="orange">Orange</option>
            <option value="grape">Grape</option>
          </PkSelect>
          <small>Selected: {{ selectValue || '(none)' }}</small>
        </div>
      </div>
    </section>

    <!-- PkButton Component -->
    <section class="component-section">
      <h2>PkButton Component</h2>
      <div class="component-grid">
        <div class="example-item">
          <div class="example-label">Button Types</div>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <PkButton @click="handleButtonClick">
              Default Button
            </PkButton>
            <PkButton type="submit">
              Submit Button
            </PkButton>
            <PkButton type="reset">
              Reset Button
            </PkButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Complete Form Example -->
    <section class="component-section">
      <h2>Complete Form Example</h2>
      <PkForm @submit="handleFormSubmit" class="dynamic-form">
        <div class="form-group">
          <label>Name:</label>
          <PkInput
            v-model="inputValue"
            placeholder="Enter your name..."
          />
        </div>

        <div class="form-group">
          <label>Age:</label>
          <PkInput
            v-model="numberValue"
            type="number"
            placeholder="Enter your age..."
          />
        </div>

        <div class="form-group">
          <label>Fruit Preference:</label>
          <PkSelect v-model="selectValue">
            <option value="">Select your favorite fruit...</option>
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
            <option value="orange">Orange</option>
            <option value="grape">Grape</option>
          </PkSelect>
        </div>

        <div class="form-group">
          <label>Subscription Type:</label>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <PkRadio
              v-model="radioValue"
              name="subscription"
              value="free"
              label="Free Plan"
            />
            <PkRadio
              v-model="radioValue"
              name="subscription"
              value="basic"
              label="Basic Plan"
            />
            <PkRadio
              v-model="radioValue"
              name="subscription"
              value="premium"
              label="Premium Plan"
            />
          </div>
        </div>

        <div class="form-group">
          <PkCheckbox
            v-model="checkboxValue"
            label="I agree to receive newsletter updates"
          />
        </div>

        <div class="form-group">
          <PkButton type="submit">
            Submit Form
          </PkButton>
        </div>
      </PkForm>
    </section>

    <!-- Component Information -->
    <section class="component-section">
      <h2>Component Information</h2>
      <div class="info">
        <p>All components support <code>v-model</code> for two-way data binding.</p>
        <p>Components follow the "Pk" prefix naming convention.</p>
        <p>Styling is scoped to each component with BEM-like class naming.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* See packages/client/src/assets/global.css for global styles */
/* Place only things specific to KitchenSink here */
</style>
