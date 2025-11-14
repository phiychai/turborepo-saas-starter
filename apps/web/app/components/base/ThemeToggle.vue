<script setup lang="ts">
/**
 * ThemeToggle - Migrated to Nuxt UI
 * Uses UColorModeButton component for automatic theme switching
 */
const { className = '' } = defineProps<{ className?: string }>();
</script>

<template>
  <UColorModeButton :class="className" />
</template>
