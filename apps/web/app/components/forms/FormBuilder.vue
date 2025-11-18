<script setup lang="ts">
/**
 * FormBuilder - Migrated to Nuxt UI
 * Uses UAlert for success/error states
 */
import DynamicForm from './DynamicForm.vue';
import type { CustomForm } from '~/types/components';

const props = defineProps<{
  form: CustomForm;
  className?: string;
}>();

const isSubmitted = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async (data: Record<string, string | number | boolean | File | null | undefined>) => {
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
      :on-submit="handleSubmit"
      :submit-label="form.submit_label || 'Submit'"
      :form-id="form.id"
    />
  </UCard>
</template>
