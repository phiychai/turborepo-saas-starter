<script setup lang="ts">
/**
 * BaseBlock - Dynamic block loader (no migration needed)
 * Routes different block types to their respective components
 */
import Hero from '~/components/block/Hero.vue';
import RichText from '~/components/block/RichText.vue';
import Gallery from '~/components/block/Gallery.vue';
import Pricing from '~/components/block/Pricing.vue';
import Posts from '~/components/block/Posts.vue';
import Form from '~/components/block/FormBlock.vue';
import type { BaseBlockProps } from '~/types/components';

const props = defineProps<BaseBlockProps>();
const blockRef = ref<HTMLElement | null>(null);

const components: Record<string, any> = {
  block_hero: Hero,
  block_richtext: RichText,
  block_gallery: Gallery,
  block_pricing: Pricing,
  block_posts: Posts,
  block_form: Form,
};

const Component = computed(() => components[props.block.collection] || null);
const componentData = computed(() => props.block.item);
</script>

<template>
  <div ref="blockRef">
    <component :is="Component" v-if="Component" :id="`block-${block.id}`" :data="componentData" />
  </div>
</template>
