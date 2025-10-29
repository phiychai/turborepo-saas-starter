<script setup lang="ts">
/**
 * FileUploadField - Migrated to Nuxt UI
 * Uses UInput with type="file"
 */
defineProps<{
	name: string;
}>();

const emits = defineEmits(['update:modelValue']);

const onFileChange = (e: Event) => {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0] || null;
	emits('update:modelValue', file);
};
</script>

<template>
	<UInput
		:id="name"
		:name="name"
		type="file"
		@change="onFileChange"
	/>
</template>
