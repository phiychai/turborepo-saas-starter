<script setup lang="ts">
import { dashboardPanel } from '#build/ui';
import type { PageBuilderProps } from '~/types/components';
import type { PageBlock } from '@turborepo-saas-starter/shared-types/schema';

const props = defineProps<PageBuilderProps>();
const authStore = useAuth();
const { isAuthenticated } = useAuth();

const validBlocks = computed(() =>
  props.sections.filter(
    (block): block is PageBlock & { collection: 'block_hero' | 'block_richtext' | 'block_gallery' | 'block_pricing' | 'block_posts' | 'block_form'; item: object } =>
      typeof block !== 'string' &&
      'collection' in block &&
      (block.collection === 'block_hero' ||
        block.collection === 'block_richtext' ||
        block.collection === 'block_gallery' ||
        block.collection === 'block_pricing' ||
        block.collection === 'block_posts' ||
        block.collection === 'block_form') &&
      !!block.item &&
      typeof block.item === 'object'
  )
);
</script>
<template>
  <div
    v-for="block in validBlocks"
    :key="block.id"
    :data-background="block.background"
    class="flex flex-col"
  >
    <BaseBlock :block="block" />
  </div>
</template>
