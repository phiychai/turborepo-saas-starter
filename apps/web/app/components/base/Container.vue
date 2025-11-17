<script setup lang="ts">
/**
 * Container - Migrated to Nuxt UI
 * Uses UContainer with responsive padding and max-width
 */
import type { ContainerProps } from '~/types/components';

const { as = 'div', className = '', role } = defineProps<ContainerProps>();
</script>

<template>
  <UContainer :is="as">
    <slot />
  </UContainer>
</template>
