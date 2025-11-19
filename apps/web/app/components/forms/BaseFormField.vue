<script setup lang="ts">
/**
 * BaseFormField - Migrated to Nuxt UI v4
 * Uses UFormField with UInput, UTextarea, and custom field components
 */
import type { FormField } from '@turborepo-saas-starter/shared-types/schema';
import { useField } from 'vee-validate';
import CheckboxField from './fields/CheckboxField.vue';
import CheckboxGroupField from './fields/CheckboxGroupField.vue';
import RadioGroupField from './fields/RadioGroupField.vue';
import SelectField from './fields/SelectField.vue';
import FileUploadField from './fields/FileUploadField.vue';

const props = defineProps<{ field: FormField }>();
const { value, errorMessage } = useField(props.field.name ?? '');

const componentMap: Record<string, Component | string> = {
  textarea: 'UTextarea',
  checkbox: CheckboxField,
  checkbox_group: CheckboxGroupField,
  radio: RadioGroupField,
  select: SelectField,
  file: FileUploadField,
};

const getFieldComponent = () => {
  const component = componentMap[props.field.type ?? ''];
  if (typeof component === 'string') {
    return resolveComponent(component);
  }
  return component || resolveComponent('UInput');
};

const getComponentProps = (field: FormField) => {
  const baseProps = {
    id: field.id,
    name: field.name ?? '',
    placeholder: field.placeholder ?? '',
    modelValue: value.value,
    'onUpdate:modelValue': (val: string | number | boolean | File | null | undefined) => (value.value = val),
  };

  if (['checkbox_group', 'radio', 'select'].includes(field.type ?? '')) {
    return { ...baseProps, options: field.choices ?? [] };
  }

  if (field.type === 'checkbox') {
    return { ...baseProps, label: field.label ?? '' };
  }

  return baseProps;
};
</script>

<template>
  <div v-if="props.field.type !== 'hidden'" :class="`field-width-${field.width ?? '100'}`">
    <UFormField
      :label="field.type !== 'checkbox' ? (field.label ?? '') : undefined"
      :required="field.required ?? false"
      :error="errorMessage"
      :help="field.help ?? undefined"
    >
      <component :is="getFieldComponent()" v-bind="getComponentProps(field)" />
    </UFormField>
  </div>
</template>

<style scoped>
.field-width-100 {
  flex: 100%;
}
.field-width-50 {
  flex: calc(50% - 1rem);
}
.field-width-67 {
  flex: calc(67% - 1rem);
}
.field-width-33 {
  flex: calc(33% - 1rem);
}
</style>
