<script setup lang="ts">
import { ref } from 'vue'
import type { ToolCallRecord } from '../services/chatService'

const props = defineProps<{
  record: ToolCallRecord
}>()

const expanded = ref(false)

function toggle() {
  expanded.value = !expanded.value
}

function prettyArgs(args: string): string {
  try {
    return JSON.stringify(JSON.parse(args), null, 2)
  } catch {
    return args
  }
}
</script>

<template>
  <div class="tool-call-badge">
    <button class="tool-call-header" @click="toggle" :aria-expanded="expanded">
      <span class="tool-call-arrow" :class="{ expanded }">&#9658;</span>
      <span class="tool-call-label">Used {{ props.record.toolCallName }} tool</span>
    </button>
    <div v-if="expanded" class="tool-call-body">
      <pre class="tool-call-args">{{ prettyArgs(props.record.args) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.tool-call-badge {
  display: inline-flex;
  flex-direction: column;
  max-width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #bfdbfe;
  background-color: #eff6ff;
  overflow: hidden;
  font-size: 0.85rem;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #1e40af;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  width: 100%;
  font-family: inherit;
  border-radius: 0;
}

.tool-call-header:hover {
  background-color: #dbeafe;
}

.tool-call-arrow {
  display: inline-block;
  font-size: 0.7rem;
  transition: transform 0.15s ease;
  color: #3b82f6;
  flex-shrink: 0;
}

.tool-call-arrow.expanded {
  transform: rotate(90deg);
}

.tool-call-label {
  color: #1e40af;
}

.tool-call-body {
  border-top: 1px solid #bfdbfe;
  padding: 0.5rem 0.75rem;
}

.tool-call-args {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}
</style>
