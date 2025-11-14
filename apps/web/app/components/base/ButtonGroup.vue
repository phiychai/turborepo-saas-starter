<script setup lang="ts">
/**
 * ButtonGroup - Migrated to Nuxt UI
 * Uses UButtonGroup for grouped button display
 */
import { type ButtonProps } from './BaseButton.vue';

export interface ButtonGroupProps {
  buttons: Array<ButtonProps>;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<ButtonGroupProps>(), {
  orientation: 'horizontal',
});
</script>

<template>
  <UButtonGroup v-if="buttons?.length" :orientation="orientation" :class="className">
    <BaseButton v-for="(button, index) in buttons" :key="index" v-bind="button" />
  </UButtonGroup>
</template>
