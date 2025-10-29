<script setup lang="ts">
/**
 * CheckboxField - Migrated to Nuxt UI
 * Uses UCheckbox component
 */
import { computed } from 'vue';

const props = defineProps<{
	modelValue: boolean;
	name: string;
	label: string;
}>();

const emits = defineEmits(['update:modelValue']);

const localValue = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emits('update:modelValue', value),
});
</script>

<template>
	<div class="flex items-center gap-x-2">
		<UCheckbox :id="props.name" v-model="localValue" :name="props.name" />
		<label :for="props.name" class="text-sm">{{ props.label }}</label>
	</div>
</template>
