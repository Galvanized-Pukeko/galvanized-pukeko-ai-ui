<script setup lang="ts">
import { catalog } from './catalog'
import type { AnyComponentNode } from '../../composables/useA2UI'

defineProps<{
  node: AnyComponentNode
  surfaceId: string
}>()
</script>

<template>
  <component
    v-if="catalog[node.type]"
    :is="catalog[node.type]"
    :node="node"
    :surfaceId="surfaceId"
  />
  <div v-else class="a2ui-unknown">Unknown: {{ node.type }}</div>
</template>

<style scoped>
.a2ui-unknown {
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #92400e;
}
</style>
