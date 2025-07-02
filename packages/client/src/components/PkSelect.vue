<template>
  <label :for="selectId"> {{ label }}</label>
  <select
    :value="modelValue"
    :disabled="disabled"
    @change="handleChange"
    :id="selectId"
    class="pk-select"
  >
    <slot></slot>
  </select>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  disabled?: boolean
  selectId?: string
  label?: string

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
  padding: var(--padding-third) var(--padding-half);
  border: var(--border-input-idle);
  border-radius: var(--border-radius-small-box);
  background-color: var(--bg-input-idle);
  width: 100%;
  /*additional 2px to width and height are because of border thickness */
  height: calc(calc(var(--padding-full) + calc(var(--padding-third) * 2)) + 2px);
  font-size: 1rem;
  font-family: inherit;
  box-shadow: none;
  cursor: pointer;
  transition: var(--transition-normal);
}

.pk-select:focus, .pk-select:hover:not(.pk-select--disabled){
  outline: none;
  border: var(--border-input-active);
  background-color: var(--bg-input-active);
  box-shadow: var(--box-shadow-inner-active);
  transition: var(--transition-normal);
}

.pk-select:disabled {
  background-color: var(--bg-input-disabled);
  border: var(--border-input-disabled);
  cursor: not-allowed;
}
</style>
