<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="handleInput"
    class="pk-input"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.pk-input {
  padding: var(--padding-small) var(--padding-half);
  border: var(--subtle-border);
  border-radius: var(--border-radius-small-box);
  width: calc(100% - var(--padding-full));
  height: var(--nice-spacing-unit);
  font-size: 1rem;
  font-family: inherit;
}

.pk-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.pk-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
</style>
