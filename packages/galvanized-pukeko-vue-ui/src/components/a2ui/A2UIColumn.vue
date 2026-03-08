<script setup lang="ts">
import type { AnyComponentNode } from '../../composables/useA2UI'
import A2UIRenderer from './A2UIRenderer.vue'

defineProps<{
  node: AnyComponentNode
  surfaceId: string
}>()
</script>

<template>
  <div class="a2ui-column">
    <template v-if="Array.isArray(node.properties.children)">
      <A2UIRenderer
        v-for="child in node.properties.children"
        :key="child.id"
        :node="child"
        :surfaceId="surfaceId"
      />
    </template>
  </div>
</template>

<style scoped>
.a2ui-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
