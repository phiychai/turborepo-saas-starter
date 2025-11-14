<script setup lang="ts">
/**
 * FormBlock - Block component for displaying forms (migrated to Nuxt UI)
 * Uses FormBuilder component which now uses Nuxt UI
 */
import type { FormField } from '@turborepo-saas-starter/shared-types/schema';

interface CustomFormData {
  id: string;
  tagline: string | null;
  headline: string | null;
  form: CustomForm;
}
interface CustomForm {
  id: string;
  on_success?: 'redirect' | 'message' | null;
  sort?: number | null;
  submit_label?: string | null;
  success_message?: string | null;
  title?: string | null;
  success_redirect_url?: string | null;
  is_active?: boolean | null;
  fields: FormField[];
}

const { setAttr } = useVisualEditing();
defineProps<{ data: CustomFormData }>();
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
