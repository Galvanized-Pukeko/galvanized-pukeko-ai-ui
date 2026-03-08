<script setup lang="ts">
import { computed, inject } from 'vue'
import { A2UIContextKey, type AnyComponentNode } from '../../composables/useA2UI'

const props = defineProps<{
  node: AnyComponentNode
  surfaceId: string
}>()

const ctx = inject(A2UIContextKey)!

const textContent = computed(() => {
  const textProp = props.node.properties.text
  if (!textProp) return ''
  if (textProp.literalString !== undefined) return textProp.literalString
  if (textProp.literal !== undefined) return textProp.literal
  if (textProp.path) {
    const data = ctx.processor.getData(props.node, textProp.path, props.surfaceId)
    return data !== null ? String(data) : ''
  }
  return ''
})

const usageHint = computed(() => props.node.properties.usageHint)
</script>

<template>
  <h1 v-if="usageHint === 'h1'">{{ textContent }}</h1>
  <h2 v-else-if="usageHint === 'h2'">{{ textContent }}</h2>
  <h3 v-else-if="usageHint === 'h3'">{{ textContent }}</h3>
  <h4 v-else-if="usageHint === 'h4'">{{ textContent }}</h4>
  <h5 v-else-if="usageHint === 'h5'">{{ textContent }}</h5>
  <small v-else-if="usageHint === 'caption'" class="a2ui-caption">{{ textContent }}</small>
  <p v-else>{{ textContent }}</p>
</template>

<style scoped>
.a2ui-caption {
  color: #6b7280;
  font-size: 0.85rem;
}
h1,
h2,
h3,
h4,
h5 {
  margin: 0.5rem 0;
}
p {
  margin: 0.25rem 0;
}
</style>
