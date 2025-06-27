<template>
  <button
    :type="type"
    :disabled="disabled"
    @click="handleClick"
    class="pk-button"
    :class="{ 'pk-button--disabled': disabled }"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style scoped>
.pk-button {
  padding: 0.5rem 1rem;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pk-button:hover:not(.pk-button--disabled) {
  background-color: #45a049;
}

.pk-button:active:not(.pk-button--disabled) {
  background-color: #3d8b40;
}

.pk-button--disabled {
  background-color: #cccccc;
  border-color: #cccccc;
  cursor: not-allowed;
}
</style>
