<script setup lang="ts">
/**
 * RichText - Block component for rich text content (no migration needed)
 * Already uses migrated base components
 */
import Text from '~/components/base/Text.vue';
import type { RichTextProps } from '~/types/components';

withDefaults(defineProps<RichTextProps>(), {
  data: () => ({
    alignment: 'left',
  }),
});

const { setAttr } = useVisualEditing();
</script>

<template>
  <div
    :class="[
      'mx-auto max-w-[600px] space-y-6',
      {
        'text-center': data.alignment === 'center',
        'text-right': data.alignment === 'right',
        'text-left': data.alignment === 'left',
      },
      data.className,
    ]"
  >
    <Tagline
      v-if="data.tagline"
      :tagline="data.tagline"
      :data-directus="
        setAttr({
          collection: 'block_richtext',
          item: data.id || null,
          fields: 'tagline',
          mode: 'popover',
        })
      "
    />
    <Headline
      v-if="data.headline"
      :headline="data.headline"
      :data-directus="
        setAttr({
          collection: 'block_richtext',
          item: data.id || null,
          fields: 'headline',
          mode: 'popover',
        })
      "
    />
    <Text
      v-if="data.content"
      :content="data.content"
      :data-directus="
        setAttr({
          collection: 'block_richtext',
          item: data.id || null,
          fields: 'content',
          mode: 'drawer',
        })
      "
    />
  </div>
</template>
