<script setup lang="ts">
/**
 * ShareDialog - Migrated to Nuxt UI
 * Uses UModal for dialog and UButton with UInput for sharing
 */
import { ref, computed } from 'vue';

const props = defineProps<{ postUrl: string; postTitle: string }>();

const isOpen = ref(false);
const copied = ref(false);
const url = computed(() => props.postUrl);

const { copy } = useClipboard({ source: url });

const handleCopy = async () => {
  if (!url.value) return;
  await copy(url.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

const socialLinks = [
  {
    service: 'reddit',
    getUrl: () =>
      `http://www.reddit.com/submit?url=${encodeURIComponent(url.value)}&title=${encodeURIComponent(props.postTitle)}`,
    icon: '/icons/social/reddit.svg',
  },
  {
    service: 'x',
    getUrl: () =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url.value)}&text=${encodeURIComponent(props.postTitle)}`,
    icon: '/icons/social/x.svg',
  },
  {
    service: 'linkedin',
    getUrl: () =>
      `https://www.linkedin.com/shareArticle/?mini=true&url=${encodeURIComponent(url.value)}&title=${encodeURIComponent(props.postTitle)}`,
    icon: '/icons/social/linkedin.svg',
  },
];
</script>

<template>
  <div>
    <UButton variant="outline" icon="i-lucide-share" label="Share Blog" @click="isOpen = true" />

    <UModal v-model="isOpen">
      <template #default>
        <div class="sm:max-w-md">
          <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6">Share this blog post</h3>
        </template>

        <div class="space-y-4">
          <div class="flex justify-center space-x-4">
            <a
              v-for="social in socialLinks"
              :key="social.service"
              :href="social.getUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded inline-flex items-center justify-center transition-opacity hover:opacity-70"
            >
              <img
                :src="social.icon"
                :alt="`${social.service} icon`"
                width="32"
                height="32"
                class="size-8 dark:invert"
              />
            </a>
          </div>

          <div class="flex items-center gap-2">
            <UInput :model-value="url" readonly class="flex-1" />
            <UButton
              icon="i-lucide-copy"
              size="sm"
              color="neutral"
              variant="solid"
              @click="handleCopy"
            />
          </div>

          <p v-if="copied" class="text-sm text-green-600 dark:text-green-400">
            Link copied to clipboard!
          </p>
        </div>

        <template #footer>
          <div class="flex justify-start">
            <UButton color="neutral" variant="ghost" label="Close" @click="isOpen = false" />
          </div>
        </template>
      </UCard>
        </div>
      </template>
    </UModal>
  </div>
</template>
