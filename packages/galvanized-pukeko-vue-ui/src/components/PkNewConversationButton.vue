<template>
  <PkButton
    class="pk-new-conversation"
    title="Start a new conversation"
    @click="$emit('click', $event)"
  >
    <svg
      class="pk-new-conversation__icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
    >
      <path
        d="M7 1.5v11M1.5 7h11"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
    <span>New Conversation</span>
  </PkButton>
</template>

<script setup lang="ts">
import PkButton from './PkButton.vue'

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
/* The class lands on PkButton's root <button> (single root, inheritAttrs), so
   target it directly rather than via :deep(button). */
.pk-new-conversation {
  display: inline-flex;
  align-items: center;
  gap: var(--padding-third);
  padding: var(--padding-third) var(--padding-twothird);
  border-radius: var(--border-radius-small-box);
}

.pk-new-conversation__icon {
  flex: 0 0 auto;
}
</style>
