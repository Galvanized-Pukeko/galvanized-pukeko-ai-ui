<template>
  <form @submit="handleSubmit">
    <slot></slot>
  </form>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  submit: [event: Event]
}>()

const handleSubmit = (event: Event) => {
  emit('submit', event)
}
</script>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>