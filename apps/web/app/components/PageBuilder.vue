<script setup lang="ts">
import { dashboardPanel } from '#build/ui';

interface PageBuilderProps {
  sections: PageBlock[];
}
const props = defineProps<PageBuilderProps>();
const authStore = useAuth();
const { isAuthenticated } = useAuth();

const validBlocks = computed(() =>
  props.sections.filter(
    (block): block is PageBlock & { collection: string; item: object } =>
      typeof block.collection === 'string' && !!block.item && typeof block.item === 'object'
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
