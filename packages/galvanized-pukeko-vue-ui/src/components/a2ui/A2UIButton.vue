<script setup lang="ts">
import { inject } from 'vue'
import { A2UIContextKey, type AnyComponentNode } from '../../composables/useA2UI'
import A2UIRenderer from './A2UIRenderer.vue'

const props = defineProps<{
  node: AnyComponentNode
  surfaceId: string
}>()

const ctx = inject(A2UIContextKey)!

function handleClick() {
  const action = props.node.properties.action
  if (action) {
    ctx.sendAction(props.surfaceId, action, props.node.id, props.node)
  }
}
</script>

<template>
  <button class="a2ui-button" @click="handleClick">
    <A2UIRenderer
      v-if="node.properties.child && typeof node.properties.child === 'object'"
      :node="node.properties.child"
      :surfaceId="surfaceId"
    />
    <span v-else>{{ node.properties.child || 'Button' }}</span>
  </button>
</template>

<style scoped>
.a2ui-button {
  padding: 0.5rem 1rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}
.a2ui-button:hover {
  background-color: #059669;
}
</style>
