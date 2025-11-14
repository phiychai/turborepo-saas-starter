<script setup lang="ts">
/**
 * CheckboxGroupField - Migrated to Nuxt UI
 * Uses UCheckbox component for multiple selections
 */
const props = defineProps<{
  modelValue: string[];
  name: string;
  options: { value: string; text: string }[];
  id?: string;
  placeholder?: string | null;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  class?: string;
}>();

const emits = defineEmits(['update:modelValue']);

const isChecked = (value: string) => props.modelValue.includes(value);

const toggleValue = (value: string, checked: boolean) => {
  let updatedValues = [...props.modelValue];

  if (checked) {
    updatedValues.push(value);
  } else {
    updatedValues = updatedValues.filter((v) => v !== value);
  }

  emits('update:modelValue', updatedValues);
};
</script>

<template>
  <div v-for="option in props.options" :key="option.value" class="flex items-center gap-x-2">
    <UCheckbox
      :id="`${props.name}-${option.value}`"
      :model-value="isChecked(option.value)"
      :name="`${props.name}-${option.value}`"
      @update:model-value="(checked) => toggleValue(option.value, checked)"
    />
    <label :for="`${props.name}-${option.value}`" class="text-sm">
      {{ option.text }}
    </label>
  </div>
</template>
