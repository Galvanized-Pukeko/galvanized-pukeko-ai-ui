<script setup lang="ts">
import { provide } from 'vue'
import {
  A2UIContextKey,
  type A2UIContext,
  type Surface,
  useA2UI,
} from '../../composables/useA2UI'
import A2UIRenderer from './A2UIRenderer.vue'

const props = defineProps<{
  surface: Surface
  surfaceId: string
  a2ui: ReturnType<typeof useA2UI>
}>()

provide(A2UIContextKey, {
  sendAction: (surfaceId, action, sourceComponentId, node) =>
    props.a2ui.sendAction(surfaceId, action, sourceComponentId, node),
  processor: props.a2ui.processor,
} as A2UIContext)
</script>

<template>
  <div class="a2ui-surface" v-if="surface.componentTree">
    <A2UIRenderer :node="surface.componentTree" :surfaceId="surfaceId" />
  </div>
</template>

<style scoped>
.a2ui-surface {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 1rem;
}
</style>
