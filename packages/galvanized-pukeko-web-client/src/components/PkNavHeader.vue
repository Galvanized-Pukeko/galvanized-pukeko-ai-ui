<script setup lang="ts">
// Empty script - component now relies on slots for all content
</script>

<template>
  <div class="nav-wrapper">
    <div class="nav-logo">
      <slot name="logo"></slot>
    </div>
    <div class="nav-links-wrapper">
      <slot name="nav-links"></slot>
    </div>
    <div class="nav-controls-wrapper">
      <slot name="nav-controls"></slot>
    </div>
  </div>
</template>

<style scoped>
.nav-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--padding-twothird);
  background-color: var(--bg-input-idle);
  border-bottom: var(--line-separator-subtle);
  height: calc(var(--padding-twothird) * 4);
}

.nav-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.nav-logo :deep(svg) {
  width: 40px;
  height: 40px;
  margin-right: var(--padding-third);
}

.nav-links-wrapper {
  display: flex;
  align-items: center;
  gap: var(--padding-twothird);
}

.nav-link {
  padding: var(--padding-third) var(--padding-twothird);
  text-decoration: none;
  color: var(--text-button-sec-idle);
  border-radius: var(--border-radius-small-box);
  transition: var(--transition-normal);
  cursor: pointer;
  border: 1px solid transparent;
  font-size: 1rem;
  font-family: inherit;
  background: none;
}

.nav-link:hover,
.nav-link.active {
  background: var(--bg-button-nob-active);
  border: var(--border-button-nob-active);
  color: var(--text-button-nob-active);
}

.nav-controls-wrapper {
  display: flex;
  align-items: stretch;
  gap: var(--padding-third);
}

.nav-control {
  padding: var(--padding-third) var(--padding-twothird);
  background: var(--bg-button-nob-idle);
  border: 1px solid transparent;
  border-radius: var(--border-radius-small-box);
  color: var(--text-button-nob-idle);
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: var(--transition-normal);
}

.nav-control:hover {
  background: var(--bg-button-nob-active);
  border: var(--border-button-nob-active);
  color: var(--text-button-nob-active);
}

@media (max-width: 768px) {
  .nav-wrapper {
    flex-direction: column;
    height: auto;
    padding: var(--padding-third);
    gap: var(--padding-third);
  }

  .nav-links-wrapper {
    order: 2;
  }

  .nav-controls-wrapper {
    order: 3;
    flex-wrap: wrap;
  }

}
</style>
