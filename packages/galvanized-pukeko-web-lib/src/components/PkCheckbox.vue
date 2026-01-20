<template>
    <label :for="checkboxId" class="pk-checkbox">
      <input
        type="checkbox"
        :id="checkboxId"
        :name="name"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleChange"
      />
      <span><slot>{{ label }}</slot></span>
    </label>
</template>

<script setup lang="ts">
interface Props {
  checkboxId?: string
  modelValue?: boolean
  name?: string
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
  /* Hide the Native Checkbox */
  /* Add if not using autoprefixer */
  -webkit-appearance: none;
  appearance: none;
  /* For iOS < 15 to remove gradient background */
  background-color: #fff;
  /* Not removed via appearance */
  margin: 0;

  /* New styles */
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  font: inherit;
  color: currentColor;
  border: var(--border-input-idle);
  border-radius: var(--border-radius-extra-small-box);

  /* This is the quickest way to align the :before to the horizontal and vertical center of our custom control */
  display: grid;
  place-content: center;
}

.pk-checkbox input[type="checkbox"]:checked{
  border: var(--border-input-active);
}

.pk-checkbox input[type="checkbox"]::before {
  content: "";
  width: 0.6rem;
  height: 0.6rem;
  transform: scale(0) translateY(0.03em);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1rem 1rem var(--form-control-color);

  /* Windows High Contrast Mode */
    background-color: CanvasText;
}

.pk-checkbox input[type="checkbox"]:checked::before {
  transform: scale(1) translateY(0.03em);
}


.pk-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.pk-checkbox span {
  user-select: none;
}

</style>
