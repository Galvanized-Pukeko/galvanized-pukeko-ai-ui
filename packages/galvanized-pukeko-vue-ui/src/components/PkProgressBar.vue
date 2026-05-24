<script setup lang="ts">
import type { RunState } from '../services/chatService'

defineProps<{
  runState: RunState
  statusText: string
}>()
</script>

<template>
  <div class="pk-progress-bar" :class="{ idle: runState === 'idle' }" role="status" aria-live="polite">
    <div class="bar">
      <div class="bar-fill" :class="runState"></div>
    </div>
    <div v-if="runState !== 'idle' && statusText" class="status-text">{{ statusText }}</div>
  </div>
</template>

<style scoped>
.pk-progress-bar {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 1.6rem;
}

.pk-progress-bar.idle {
  min-height: 0;
}

.bar {
  position: relative;
  height: 2px;
  width: 100%;
  background: var(--grey-94);
  overflow: hidden;
}

.pk-progress-bar.idle .bar {
  visibility: hidden;
}

.bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 30%;
  background: var(--grey-33);
  animation: pk-progress-slide 1.4s linear infinite;
  will-change: transform;
}

.bar-fill.running-tool {
  background: var(--grey-20);
}
.bar-fill.waiting {
  background: var(--grey-50);
}
.bar-fill.streaming {
  background: var(--grey-27);
}

.status-text {
  text-align: center;
  font-size: 0.8rem;
  color: var(--grey-40);
  padding: var(--padding-quarter) var(--padding-twothird);
  font-style: italic;
  min-height: 1.2rem;
}

@keyframes pk-progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

@media (prefers-reduced-motion: reduce) {
  .bar-fill {
    animation: none;
    width: 100%;
    opacity: 0.4;
  }
}
</style>
