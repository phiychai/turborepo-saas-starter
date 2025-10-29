<script setup lang="ts">
interface PageBuilderProps {
	sections: PageBlock[];
}

const props = defineProps<PageBuilderProps>();

const validBlocks = computed(() =>
	props.sections.filter(
		(block): block is PageBlock & { collection: string; item: object } =>
			typeof block.collection === 'string' && !!block.item && typeof block.item === 'object',
	),
);
</script>

<template>
  <div v-for="block in validBlocks" :key="block.id" :data-background="block.background">
    <!-- Multiple full-width blocks -->
    <BaseBlock
      :block="block"
      v-if="['block_hero', 'block_cta', 'block_testimonials'].includes(block.collection)"

    />

    <!-- Everything else in container -->
    <Container v-else>
      <BaseBlock :block="block" />
    </Container>
  </div>
</template>
