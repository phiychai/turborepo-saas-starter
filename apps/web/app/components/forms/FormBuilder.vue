<script setup lang="ts">
/**
 * FormBuilder - Migrated to Nuxt UI
 * Uses UAlert for success/error states
 */
import DynamicForm from './DynamicForm.vue';
import type { FormField } from '@turborepo-saas-starter/shared-types/schema';

interface CustomFormData {
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

const props = defineProps<{
  form: CustomFormData;
  className?: string;
}>();

const isSubmitted = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async (data: Record<string, any>) => {
  error.value = null;
  try {
    const fieldsWithNames = props.form.fields.map((field) => ({
      id: field.id,
      name: field.name || '',
      type: field.type || '',
    }));

    const formData = new FormData();
    formData.append('formId', props.form.id);
    formData.append('fields', JSON.stringify(fieldsWithNames));

    for (const key in data) {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]?.toString() || '');
      }
    }

    await $fetch('/api/forms/submit', {
      method: 'POST',
      body: formData,
    });

    if (props.form.on_success === 'redirect' && props.form.success_redirect_url) {
      window.location.href = props.form.success_redirect_url;
    } else {
      isSubmitted.value = true;
    }
  } catch {
    error.value = 'Failed to submit the form. Please try again later.';
  }
};
</script>

<template>
  <UCard v-if="form.is_active" :class="className">
    <UAlert
      v-if="error"
      color="red"
      icon="i-lucide-alert-circle"
      variant="solid"
      :title="error"
      class="mb-6"
    />

    <UAlert
      v-if="isSubmitted"
      color="green"
      icon="i-lucide-check-circle"
      variant="subtle"
      :description="form.success_message || 'Your form has been submitted successfully.'"
      class="mb-6"
    />

    <DynamicForm
      v-if="!isSubmitted"
      :fields="form.fields"
      :onSubmit="handleSubmit"
      :submitLabel="form.submit_label || 'Submit'"
      :formId="form.id"
    />
  </UCard>
</template>
