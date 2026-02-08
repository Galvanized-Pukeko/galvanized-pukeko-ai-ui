<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text?: string
  href?: string
  img?: string
}>()

const hasLink = computed(() => !!props.href)
const componentTag = computed(() => hasLink.value ? 'a' : 'div')
</script>

<template>
  <component
    :is="componentTag"
    :href="href"
    :class="['config-item', { 'is-link': hasLink }]"
  >
    <img v-if="img" :src="img" class="config-item-img" alt="" />
    <span v-if="text" class="config-item-text">{{ text }}</span>
  </component>
</template>

<style scoped>
.config-item {
  display: flex;
  align-items: center;
  gap: var(--padding-third, 0.5rem);
  text-decoration: none;
  color: inherit;
  font-family: inherit;
}

.is-link {
  cursor: pointer;
  transition: opacity 0.2s;
}

.is-link:hover {
  opacity: 0.8;
}

.config-item-img {
  height: 24px;
  width: auto;
  object-fit: contain;
}

.config-item-text {
  font-size: 1rem;
  white-space: nowrap;
}
</style>
