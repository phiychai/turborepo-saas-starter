<script setup lang="ts">
interface HeadlineProps {
  headline?: string | null;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const props = withDefaults(defineProps<HeadlineProps>(), {
  as: 'h2',
});
</script>

<template>
  <ProseH1 v-if="as === 'h1' && headline">{{ headline }}</ProseH1>
  <ProseH2 v-else-if="as === 'h2' && headline">{{ headline }}</ProseH2>
  <ProseH3 v-else-if="as === 'h3' && headline">{{ headline }}</ProseH3>
  <ProseH4 v-else-if="as === 'h4' && headline">{{ headline }}</ProseH4>
  <ProseH5 v-else-if="as === 'h5' && headline">{{ headline }}</ProseH5>
  <ProseH6 v-else-if="as === 'h6' && headline">{{ headline }}</ProseH6>
</template>
