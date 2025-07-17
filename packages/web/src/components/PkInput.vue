<template>
  <label :for="inputId"><slot>{{ label }}</slot></label>
  <input
    :type="type"
    :value="modelValue"
    :id="inputId"
    :name="name"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="handleInput"
    class="pk-input"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  inputId?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  name?: string
  label?: string
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
  padding: var(--padding-third) var(--padding-twothird);
  border: var(--border-input-idle);
  border-radius: var(--border-radius-small-box);
  background-color: var(--bg-input-idle);
  width: 100%;
  /*additional 2px to width and height are because of border thickness */
  height: calc(calc(var(--padding-full) + calc(var(--padding-third) * 2)) + 2px);
  font-size: 1rem;
  font-family: inherit;
  box-shadow: none;
  transition: var(--transition-normal);
}

.pk-input:focus, .pk-input:hover:not(.pk-input--disabled){
  outline: none;
  border: var(--border-input-active);
  background-color: var(--bg-input-active);
  box-shadow: var(--box-shadow-inner-active);
  transition: var(--transition-normal);
}

.pk-input:disabled {
  background-color: var(--bg-input-disabled);
  border: var(--border-input-disabled);
  cursor: not-allowed;
}

label {
  height: var(--nice-spacing-unit);
  display: block;
  line-height: var(--nice-spacing-unit);
}
</style>
