<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    @change="handleChange"
    class="pk-select"
  >
    <slot></slot>
  </select>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.pk-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
}

.pk-select:focus {
  outline: none;
  border-color: #4CAF50;
}

.pk-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
</style>