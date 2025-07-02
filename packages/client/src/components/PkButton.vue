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
  padding: var(--padding-third) var(--padding-twothird);
  border: 1px solid var(--border-button-prim-idle);
  border-radius: var(--border-radius-small-box);
  background-image: var(--bg-button-prim-idle);
  color: var(--text-button-prim-idle);
  height: calc(calc(var(--nice-spacing-unit) + var(--padding-twothird)) + 2px);
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  box-shadow: none;
  transition: var(--transition-normal);
}

.pk-button:hover:not(.pk-button--disabled) {
  border: 1px solid var(--border-button-prim-active);
  background-image: var(--bg-button-prim-active);
  color: var(--text-button-prim-active);
  box-shadow: var(--box-shadow-drop-active);
  transition: var(--transition-normal);
}

.pk-button:active:not(.pk-button--disabled) {
  background-image: var(--bg-button-prim-active);
  color: var(--text-button-prim-active);
  box-shadow: var(--box-shadow-drop-active);
  transition: var(--transition-normal);
}

.pk-button--disabled {
  background-image: var(--bg-button-prim-disabled);
  border-color: var(--border-button-prim-disabled);
  cursor: not-allowed;
}
</style>
