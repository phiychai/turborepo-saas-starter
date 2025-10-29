<script setup lang="ts">
/**
 * RadioGroupField - Migrated to Nuxt UI
 * Uses URadioGroup component
 */
import { computed } from 'vue';

const props = defineProps<{
	modelValue: string;
	name: string;
	options: { value: string; text: string }[];
}>();

const emits = defineEmits(['update:modelValue']);

const localValue = computed({
	get: () => props.modelValue,
	set: (value: string) => emits('update:modelValue', value),
});

// Map options to Nuxt UI format
const mappedOptions = computed(() =>
	props.options.map(option => ({
		value: option.value,
		label: option.text,
	}))
);
</script>

<template>
	<URadioGroup
		v-model="localValue"
		:name="props.name"
		:options="mappedOptions"
	/>
</template>
