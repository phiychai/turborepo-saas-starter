<script setup lang="ts">
/**
 * Container - Migrated to Nuxt UI
 * Uses UContainer with responsive padding and max-width
 */
export interface ContainerProps {
  as?: 'div' | 'section' | 'main' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'form';
  className?: string;
  role?: string;
}

const { as = 'div', className = '', role } = defineProps<ContainerProps>();
</script>

<template>
  <UContainer :is="as">
    <slot />
  </UContainer>
</template>
