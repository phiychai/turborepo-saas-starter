<script setup lang="ts">
interface ProseProps {
	content: string;
	size?: 'sm' | 'md' | 'lg';
	itemId?: string;
	collection?: string;
}
const props = withDefaults(defineProps<ProseProps>(), {
  size: 'md',
});
const contentEl = ref<HTMLElement | null>(null);
const mdcKey = ref(0);
const isReady = ref(true);

onMounted(() => {
	const config = useRuntimeConfig();
	if (!contentEl.value) return;

	const anchors = Array.from(contentEl.value.getElementsByTagName('a'));

	for (const anchor of anchors) {
		const href = anchor.getAttribute('href');
		if (!href) continue;

		const url = new URL(href, window.location.origin);
		const isLocal = url.hostname === config.public.siteUrl;

		if (isLocal) {
			anchor.addEventListener('click', (e) => {
				e.preventDefault();
				navigateTo({
					path: url.pathname,
					hash: url.hash,
					query: Object.fromEntries(url.searchParams.entries()),
				});
			});
		} else {
			anchor.setAttribute('target', '_blank');
			anchor.setAttribute('rel', 'noopener noreferrer');
		}
	}
});
// Watch for content changes and force re-render properly
watch(() => props.content, async () => {
  isReady.value = false;
  await nextTick();
  mdcKey.value++;
  await nextTick();
  isReady.value = true;
}, { immediate: false });
</script>

<template>

{{ mdcKey }}
   <MDC
    v-if="isReady"
    :key="mdcKey"
    :value="content"
    :class="[
      'prose dark:prose-invert max-w-none',
      {
        'prose-sm': size === 'sm',
        'md:prose-base lg:prose-lg': size === 'md',
        'prose-lg lg:prose-xl': size === 'lg',
      }
    ]"
  />
</template>
