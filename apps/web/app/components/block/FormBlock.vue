<script setup lang="ts">
/**
 * FormBlock - Block component for displaying forms (migrated to Nuxt UI)
 * Uses FormBuilder component which now uses Nuxt UI
 */
import type { CustomFormData } from '~/types/components';

defineProps<{ data: CustomFormData }>();
const { setAttr } = useVisualEditing();
</script>

<template>
  <section v-if="data.form" class="mx-auto">
    <Tagline
      v-if="data.tagline"
      :tagline="data.tagline"
      :data-directus="
        setAttr({
          collection: 'block_form',
          item: data.id,
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
          collection: 'block_form',
          item: data.id,
          fields: 'headline',
          mode: 'popover',
        })
      "
    />

    <div
      :data-directus="
        setAttr({
          collection: 'block_form',
          item: data.id,
          fields: ['form'],
          mode: 'popover',
        })
      "
    >
      <FormBuilder :form="data.form" class="mt-8" />
    </div>
  </section>
</template>
