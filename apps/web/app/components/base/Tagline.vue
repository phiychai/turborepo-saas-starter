<script setup lang="ts">
/**
 * Tagline - Migrated to Nuxt UI Typography
 * Uses ProseP component with custom styling for taglines
 */
import type { TaglineProps } from '~/types/components';

const props = defineProps<TaglineProps>();
</script>

<template>
  <ProseP v-if="tagline" :class="[className]">
    {{ tagline }}
  </ProseP>
</template>
