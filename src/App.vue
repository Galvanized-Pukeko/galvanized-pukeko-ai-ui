<script setup lang="ts">
import { ref } from 'vue'
import PkForm from './components/PkForm.vue'
import PkInput from './components/PkInput.vue'
import PkCheckbox from './components/PkCheckbox.vue'
import PkRadio from './components/PkRadio.vue'
import PkSelect from './components/PkSelect.vue'
import PkButton from './components/PkButton.vue'

const inputValue = ref('')
const checkboxValue = ref(false)
const radioValue = ref('option1')
const selectValue = ref('vue')

const handleSubmit = (event: Event) => {
  event.preventDefault()
  console.log('Form submitted with values:', {
    input: inputValue.value,
    checkbox: checkboxValue.value,
    radio: radioValue.value,
    select: selectValue.value
  })
}
</script>

<template>
  <div class="app">
    <h1>Pukeko UI Components Demo</h1>
    
    <PkForm @submit="handleSubmit">
      <div class="form-group">
        <label>Text Input:</label>
        <PkInput v-model="inputValue" placeholder="Enter some text" />
        <small>Current value: {{ inputValue }}</small>
      </div>

      <div class="form-group">
        <PkCheckbox v-model="checkboxValue" label="Accept terms and conditions" />
        <small>Checked: {{ checkboxValue }}</small>
      </div>

      <div class="form-group">
        <label>Radio Options:</label>
        <div class="radio-group">
          <PkRadio v-model="radioValue" name="options" value="option1" label="Option 1" />
          <PkRadio v-model="radioValue" name="options" value="option2" label="Option 2" />
          <PkRadio v-model="radioValue" name="options" value="option3" label="Option 3" />
        </div>
        <small>Selected: {{ radioValue }}</small>
      </div>

      <div class="form-group">
        <label>Select Framework:</label>
        <PkSelect v-model="selectValue">
          <option value="vue">Vue.js</option>
          <option value="react">React</option>
          <option value="angular">Angular</option>
          <option value="svelte">Svelte</option>
        </PkSelect>
        <small>Selected: {{ selectValue }}</small>
      </div>

      <div class="form-actions">
        <PkButton type="submit">Submit Form</PkButton>
        <PkButton type="button" @click="inputValue = ''; checkboxValue = false; radioValue = 'option1'; selectValue = 'vue'">
          Reset
        </PkButton>
        <PkButton disabled>Disabled Button</PkButton>
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
  margin-bottom: 2rem;
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
