<template>
  <label class="pk-radio">
    <input
      type="radio"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      @change="handleChange"
    />
    <span><slot>{{ label }}</slot></span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  value: string | number
  name: string
  label?: string
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    emit('update:modelValue', target.value)
  }
}
</script>

<style scoped>
.pk-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  height: var(--padding-full);
}

.pk-radio input[type="radio"] {
  /* Hide the Native Checkbox */
  /* Add if not using autoprefixer */
  -webkit-appearance: none;
  appearance: none;
  /* For iOS < 15 to remove gradient background */
  background-color: #fff;
  /* Not removed via appearance */
  margin: 0;

  /* New styles */
  font: inherit;
  color: currentColor;
  width: 1rem;
  height: 1rem;
  border: var(--border-input-idle);
  border-radius: 50%;
  cursor: pointer;

  /* This is the quickest way to align the :before to the horizontal and vertical center of our custom control */
  display: grid;
  place-content: center;
}

.pk-radio input[type="radio"]::before {
  content: "";
  width: 0.63rem;
  height: 0.63rem;
  border-radius: 50%;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1rem 1rem var(--form-control-color);
}

.pk-radio input[type="radio"]:checked::before {
  transform: scale(1);
}
.pk-radio input[type="radio"]:checked{
  border: var(--border-input-active);
}

.pk-radio input[type="radio"]:disabled {
  cursor: not-allowed;
}

.pk-radio span {
  user-select: none;
}
</style>
