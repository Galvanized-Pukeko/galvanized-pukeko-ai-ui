<script setup lang="ts">
import { CoreApp } from '@galvanized-pukeko-ai-ui/web-lib'

// Since configService is now in the library, we might need to initialize it or it's shared?
// In the original App.vue, configService.get() was called.
// Here we just render CoreApp. CoreApp (in lib) handles connection and config?
// Wait, CoreApp.vue logic references ./services/configService which is now in lib.
// So CoreApp should be self-contained.
// However, main.ts calls configService.load()!
</script>

<template>
  <CoreApp />
</template>
