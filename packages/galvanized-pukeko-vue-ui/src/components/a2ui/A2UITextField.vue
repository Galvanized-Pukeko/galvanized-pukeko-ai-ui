<script setup lang="ts">
import { computed, inject } from 'vue'
import { A2UIContextKey, type AnyComponentNode } from '../../composables/useA2UI'

const props = defineProps<{
  node: AnyComponentNode
  surfaceId: string
}>()

const ctx = inject(A2UIContextKey)!

const label = computed(() => {
  const labelProp = props.node.properties.label
  if (!labelProp) return ''
  if (labelProp.literalString !== undefined) return labelProp.literalString
  if (labelProp.literal !== undefined) return labelProp.literal
  if (labelProp.path) {
    const data = ctx.processor.getData(props.node, labelProp.path, props.surfaceId)
    return data !== null ? String(data) : ''
  }
  return ''
})

const textValue = computed(() => {
  const textProp = props.node.properties.text
  if (!textProp) return ''
  if (textProp.path) {
    const data = ctx.processor.getData(props.node, textProp.path, props.surfaceId)
    return data !== null ? String(data) : ''
  }
  if (textProp.literalString !== undefined) return textProp.literalString
  if (textProp.literal !== undefined) return textProp.literal
  return ''
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const textProp = props.node.properties.text
  const path = textProp?.path ?? props.node.id
  ctx.processor.setData(props.node, path, target.value, props.surfaceId)
}

const inputType = computed(() => {
  const type = props.node.properties.type
  if (type === 'number') return 'number'
  if (type === 'date') return 'date'
  return 'text'
})

const isLongText = computed(() => props.node.properties.type === 'longText')
</script>

<template>
  <div class="a2ui-textfield">
    <label v-if="label" class="a2ui-textfield-label">{{ label }}</label>
    <textarea
      v-if="isLongText"
      :value="textValue"
      @input="onInput"
      :placeholder="label"
      class="a2ui-textfield-input a2ui-textarea"
    />
    <input
      v-else
      :type="inputType"
      :value="textValue"
      @input="onInput"
      :placeholder="label"
      class="a2ui-textfield-input"
    />
  </div>
</template>

<style scoped>
.a2ui-textfield {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.a2ui-textfield-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.a2ui-textfield-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.a2ui-textfield-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}
.a2ui-textarea {
  min-height: 80px;
  resize: vertical;
}
</style>
