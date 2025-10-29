<script setup lang="ts">
/**
 * Tagline - Migrated to Nuxt UI Typography
 * Uses ProseP component with custom styling for taglines
 */
interface TaglineProps {
	tagline?: string | null;
	className?: string;
}

const props = defineProps<TaglineProps>();
</script>

<template>
	<ProseP
		v-if="tagline"
		:class="[className]"
	>
		{{ tagline }}
	</ProseP>
</template>
