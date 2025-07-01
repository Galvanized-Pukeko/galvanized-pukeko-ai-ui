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
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  margin: auto var(--padding-sixth);
}

.pk-radio input[type="radio"]:disabled {
  cursor: not-allowed;
}

.pk-radio span {
  user-select: none;
}
</style>
