<template>
  <div class="pk-checkbox">
    <input
      type="checkbox"
      :id="checkboxId"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />
    <label :for="checkboxId"><slot>{{ label }}</slot></label>
  </div>
</template>

<script setup lang="ts">
interface Props {
  checkboxId?: string
  modelValue?: boolean
  label?: string
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<style scoped>
.pk-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  height: var(--padding-full);
}

.pk-checkbox input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  margin: auto var(--padding-sixth);
}

.pk-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.pk-checkbox span {
  user-select: none;
}
</style>
