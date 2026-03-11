<script setup lang="ts">
import {ref, onMounted} from 'vue'
import ChatInterface from './components/ChatInterface.vue'
import A2UISurface from './components/a2ui/A2UISurface.vue'
import { useA2UI } from './composables/useA2UI'
import PkNavHeader from './components/PkNavHeader.vue'
import PkLogo from './components/PkLogo.vue'
import PkLogoLarge from './components/PkLogoLarge.vue'
import PkNavItem from './components/PkNavItem.vue'
import { configService, type UiConfig } from './services/configService';

const uiConfig = ref<UiConfig | null>(configService.get())

// A2UI composable for rendering agent-driven UI surfaces
const a2ui = useA2UI()

onMounted(() => {
  if (uiConfig.value?.pageTitle) {
    document.title = uiConfig.value.pageTitle
  }
});
</script>

<template>
  <div class="app-container">
    <!-- Header -->
    <header id="galvanized-pukeko-ui-nav-header" class="app-header">
      <PkNavHeader>
        <template #logo>
          <PkNavItem
            v-if="uiConfig?.logo"
            :text="uiConfig.logo.text"
            :href="uiConfig.logo.href"
            :img="uiConfig.logo.img"
          />
          <PkLogo v-else/>
        </template>
        <template #nav-links>
          <template v-if="uiConfig?.header">
            <PkNavItem
              v-for="(item, index) in uiConfig.header"
              :key="index"
              :text="item.text"
              :href="item.href"
              :img="item.img"
              class="nav-link-item"
            />
          </template>
        </template>
      </PkNavHeader>
    </header>

    <!-- Main layout with sidebars and content -->
    <div class="app-main-layout">
      <!-- Left Sidebar -->
      <aside id="galvanized-pukeko-ui-nav-left-sidebar" class="app-left-sidebar">
        <!-- Empty by default -->
      </aside>

      <!-- Main Content Area -->
      <main class="app-main-content">
        <div class="split-screen">
          <!-- Left Side: Chat Interface -->
          <div class="chat-panel">
            <ChatInterface :a2ui="a2ui" />
          </div>

          <!-- Right Side: Content -->
          <div class="content-panel">
            <div class="app-content">
              <!-- A2UI Surfaces rendered from agent tool calls -->
              <template v-if="a2ui.surfaces.value.size > 0">
                <A2UISurface
                  v-for="[id, surface] in a2ui.surfaces.value"
                  :key="id"
                  :surface="surface"
                  :surfaceId="id"
                  :a2ui="a2ui"
                />
              </template>

              <div v-if="a2ui.surfaces.value.size === 0"
                   id="galvanized-pukeko-ui-waiting-placeholder"
                   class="waiting-placeholder">
                <PkLogoLarge />
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <aside id="galvanized-pukeko-ui-nav-right-sidebar" class="app-right-sidebar">
        <!-- Empty by default -->
      </aside>
    </div>

    <!-- Footer -->
    <footer id="galvanized-pukeko-ui-nav-footer" class="app-footer">
      <div v-if="uiConfig?.footer" class="footer-content">
        <PkNavItem
          v-for="(item, index) in uiConfig.footer"
          :key="index"
          :text="item.text"
          :href="item.href"
          :img="item.img"
          class="footer-item"
        />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* See packages/client/src/assets/global.css for global styles */
/* Place only things specific to DevSite here */

.app-container {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}

.app-header {
  grid-row: 1;
  z-index: 100;
}

.app-main-layout {
  grid-row: 2;
  display: grid;
  grid-template-columns: auto 1fr auto;
  overflow: hidden;
}

.app-left-sidebar {
  grid-column: 1;
  overflow-y: auto;
  /* Empty by default, will take no space unless content is added */
}

.app-left-sidebar:empty {
  display: none;
}

.app-main-content {
  grid-column: 2;
  overflow: hidden;
}

.app-right-sidebar {
  grid-column: 3;
  overflow-y: auto;
  /* Empty by default, will take no space unless content is added */
}

.app-right-sidebar:empty {
  display: none;
}

.app-footer {
  grid-row: 3;
  background-color: var(--bg-input-idle);
  border-top: var(--line-separator-subtle);
}

.app-footer:empty {
  display: none;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--padding-twothird);
  padding: var(--padding-third);
  height: calc(var(--padding-twothird) * 3);
}

.footer-item {
  color: var(--text-button-sec-idle);
}

.nav-link-item {
  padding: var(--padding-third) var(--padding-twothird);
  border-radius: var(--border-radius-small-box);
  transition: var(--transition-normal);
}

.nav-link-item:hover {
  background: var(--bg-button-nob-active);
  color: var(--text-button-nob-active);
}

.split-screen {
  display: flex;
  height: 100%;
  width: 100%;
}

.chat-panel {
  width: 40%;
  height: 100%;
  min-width: 300px;
}

.content-panel {
  width: 60%;
  height: 100%;
  overflow-y: auto;
  background-color: #f9fafb;
}

.app-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.waiting-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40%;
  margin: 0 auto;
  opacity: 0.2;
  padding: 2rem 0;
}

.waiting-placeholder :deep(svg) {
  height: 70vh;
  aspect-ratio: auto;
}
</style>
