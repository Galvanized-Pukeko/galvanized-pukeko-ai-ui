<script setup lang="ts">
  import PkButton from './PkButton.vue'

  interface Props {
    modelValue?: string | number
    inputId?: string
    type?: "number"
    placeholder?: string
    disabled?: boolean
    name?: string
    label?: string
    step?: number
    min?: number
    max?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'number',
    step: 1
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string | number]
  }>()

  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', target.value)
  }

  const increment = () => {
    if (props.disabled) return
    const currentValue = Number(props.modelValue) || 0
    const newValue = currentValue + props.step
    if (props.max === undefined || newValue <= props.max) {
      emit('update:modelValue', newValue)
    }
  }

  const decrement = () => {
    if (props.disabled) return
    const currentValue = Number(props.modelValue) || 0
    const newValue = currentValue - props.step
    if (props.min === undefined || newValue >= props.min) {
      emit('update:modelValue', newValue)
    }
  }
</script>

<template>
  <label :for="inputId"><slot>{{ label }}</slot></label>
  <div class="counter-group--container" role="input">
    <PkButton
      @click="decrement"
      type="button"
      :disabled="disabled"
      class="pk-button-control-size pk-button-sec"
      >-</PkButton>
    <input
      :type="type"
      :value="modelValue"
      :id="inputId"
      :name="name"
      :placeholder="placeholder"
      :disabled="disabled"
      :step="step"
      :min="min"
      :max="max"
      @input="handleInput"
      class="pk-input-counter"
    />
    <PkButton
      @click="increment"
      type="button"
      :disabled="disabled"
      class="pk-button-control-size pk-button-sec"
      >+</PkButton>
  </div>
</template>

<style scoped>
/* TODO: remove styles for root from here */
:root {
  --border-radius: 3px;
  --border: 2px solid #3b3b3b;
  --control-size: 38px;
  --font-size: 20px;
}

.counter-group--container {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.pk-button-control-size {
  width: auto;

  &:hover {
    background: #eee;
  }

  &:active {
    background: #ddd;
  }
}

.pk-button-control-size:focus,
.pk-input-counter:focus {
  outline: 2px solid #3e67fd;
  outline-offset: 1px
}

.pk-input-counter {
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

  /* TODO: sort styles overriding here */
  margin: 0;
  /*width: 80px;*/
  text-align: center;

  &:hover {
    border-color: #777;
  }
}

label {
  height: var(--nice-spacing-unit);
  display: block;
  line-height: var(--nice-spacing-unit);
}
</style>
