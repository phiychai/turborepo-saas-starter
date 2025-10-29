<script setup lang="ts">
/**
 * SelectField - Migrated to Nuxt UI
 * Uses USelect component
 */
import { computed } from 'vue';

const props = defineProps<{
	modelValue: string;
	name: string;
	options?: { value: string; text: string }[];
	placeholder?: string;
}>();

const emits = defineEmits(['update:modelValue']);

const localValue = computed({
	get: () => props.modelValue,
	set: (value: string) => emits('update:modelValue', value),
});

// Map options to Nuxt UI format
const mappedOptions = computed(() =>
	(props.options ?? []).map(option => ({
		value: option.value,
		label: option.text,
	}))
);
</script>

<template>
	<USelect
		v-model="localValue"
		:id="props.name"
		:name="props.name"
		:options="mappedOptions"
		:placeholder="props.placeholder || 'Select an option'"
	/>
</template>
