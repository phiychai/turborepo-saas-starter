<script setup lang="ts">
import type { ProseProps } from '~/types/components';

const props = withDefaults(defineProps<ProseProps>(), {
  size: 'md',
});
const contentEl = ref<HTMLElement | null>(null);
const mdcKey = computed(() => props.content);

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

// Re-run anchor setup when content changes
watch(
  () => props.content,
  () => {
    nextTick(() => {
      if (!contentEl.value) return;
      const config = useRuntimeConfig();
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
  }
);
</script>

<template>
  <div ref="contentEl">
    <MDC
      v-if="content"
      :key="mdcKey"
      :value="content"
      :class="[
        'prose dark:prose-invert max-w-none',
        {
          'prose-sm': size === 'sm',
          'md:prose-base lg:prose-lg': size === 'md',
          'prose-lg lg:prose-xl': size === 'lg',
        },
      ]"
    />
    <div v-else class="text-muted italic">No content available</div>
  </div>
</template>
