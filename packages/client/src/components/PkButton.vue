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

  height: calc(calc(var(--nice-spacing-unit) + var(--padding-twothird)) + 2px);
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  box-shadow: none;
  transition: var(--transition-normal);

  &.pk-button-normal-size {
    width: auto;
  }

  &.pk-button-full-size {
    width: 100%;
  }

  &:hover:not(.pk-button--disabled),
  &:active:not(.pk-button--disabled) {
      border-radius: var(--border-radius-small-box);
      padding: var(--padding-third) var(--padding-twothird);
      transition: var(--transition-normal);
  }

  &.pk-button-prim {
    /* for sharper look, we add gradient border */
    background: var(--bg-button-prim-idle) padding-box,
                var(--border-button-prim-idle) border-box;
    border: 1px solid transparent;
    border-radius: var(--border-radius-small-box);
    padding: var(--padding-third) var(--padding-twothird);

    color: var(--text-button-prim-idle);

    &:hover:not(.pk-button--disabled),
    &:active:not(.pk-button--disabled) {
      /* for sharper look, we add gradient border */
      background: var(--bg-button-prim-active) padding-box,
                  var(--border-button-prim-active) border-box;
      border: 1px solid transparent;
      color: var(--text-button-prim-active);
    }
  }

    &.pk-button-sec {
      /* for sharper look, we add gradient border */
      background: var(--bg-button-sec-idle) padding-box,
                  var(--border-button-sec-idle) border-box;
      border: 1px solid transparent;
      border-radius: var(--border-radius-small-box);
      padding: var(--padding-third) var(--padding-twothird);

      color: var(--text-button-sec-idle);

      &:hover:not(.pk-button--disabled),
      &:active:not(.pk-button--disabled) {
        /* for sharper look, we add gradient border */
        background: var(--bg-button-sec-active) padding-box,
                    var(--border-button-sec-active) border-box;
        border: 1px solid transparent;
        color: var(--text-button-sec-active);
      }
    }

    &.pk-button-no-border {
      /* for sharper look, we add gradient border */
      background: var(--bg-button-nob-idle) padding-box,
                  var(--border-button-nob-idle) border-box;
      border: 1px solid transparent;
      border-radius: var(--border-radius-small-box);
      padding: var(--padding-third) var(--padding-twothird);

      color: var(--text-button-nob-idle);

      &:hover:not(.pk-button--disabled),
      &:active:not(.pk-button--disabled) {
        /* for sharper look, we add gradient border */
        background: var(--bg-button-nob-active);
        border: 1px solid transparent;
        color: var(--text-button-nob-active);
      }
    }
}

.pk-button--disabled {

  /* for sharper look, we add gradient border */
  background: var(--bg-button-disabled) padding-box,
              var(--border-button-disabled) border-box;
  border: 1px solid transparent;
  border-radius: var(--border-radius-small-box);
  padding: var(--padding-third) var(--padding-twothird);

  height: calc(calc(var(--nice-spacing-unit) + var(--padding-twothird)) + 2px);
  font-size: 1rem;
  font-family: inherit;
  box-shadow: none;
  color: var(--text-button-disabled);
  cursor: not-allowed;

}
</style>
