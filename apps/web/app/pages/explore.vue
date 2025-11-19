<script setup lang="ts">
import type { Page, PageBlock } from '@turborepo-saas-starter/shared-types/schema';
import { withLeadingSlash, withoutTrailingSlash } from 'ufo';
const authStore = useAuthStore();
const { isAuthenticated } = useAuth();

const route = useRoute();
const { enabled, state } = useLivePreview();
const pageUrl = useRequestURL();
const { isVisualEditingEnabled, apply, setAttr } = useVisualEditing();

const permalink = withoutTrailingSlash(withLeadingSlash(route.path));

// Try to fetch page from Directus, but don't fail if it doesn't exist
// This allows explore.vue to work as a standalone page or with Directus content
const {
  data: page,
  error,
  refresh,
} = await useFetch<Page>('/api/pages/one', {
  key: `pages-${permalink}`,
  query: {
    permalink,
    preview: enabled.value ? true : undefined,
    token: enabled.value ? state.token : undefined,
  },
  // Don't throw on error - allow page to work standalone
  onResponseError() {
    // Silently handle missing page - explore works without Directus content
  },
});

const pageBlocks = computed(() => (page.value?.blocks as PageBlock[]) || []);
// Create data object for Posts component
// Posts will fetch from /api/posts directly
const postsData = computed(() => ({
  id: `posts-${permalink}`,
  limit: 20, // Default limit, or get from page/block if needed
  tagline: page.value?.title || 'Explore',
  headline: page.value?.title || 'Posts', // Or get from page/block
  posts: [], // Empty array - Posts component will fetch its own
}));
useSeoMeta({
  title: page.value?.seo?.title || page.value?.title || 'Explore',
  description: page.value?.seo?.meta_description || 'Explore our content',
  ogTitle: page.value?.seo?.title || page.value?.title || 'Explore',
  ogDescription: page.value?.seo?.meta_description || 'Explore our content',
  ogUrl: pageUrl.toString(),
});

// Helper functions for Visual Editing
function applyVisualEditing() {
  apply({
    onSaved: async () => {
      await refresh();
    },
  });
}

function applyVisualEditingButton() {
  apply({
    elements: document.querySelector('#visual-editing-button'),
    customClass: 'visual-editing-button-class',
    onSaved: async () => {
      await refresh();
      // This makes sure the visual editor elements are updated after the page is refreshed. In case you've added new blocks to the page.
      await nextTick();
      applyVisualEditing();
    },
  });
}

onMounted(() => {
  if (!isVisualEditingEnabled.value) return;
  applyVisualEditingButton();
  applyVisualEditing();
});
</script>

<template>
  <UDashboardPanel v-if="isAuthenticated" class="pb-[64px]" variant="ghost">
    <Posts :data="postsData" />
  </UDashboardPanel>
  <!-- Show Directus page content if available, otherwise show posts directly -->
  <PageBuilder v-else-if="page && pageBlocks.length > 0" :sections="pageBlocks" />
  <div v-else>
    <Posts :data="postsData" />
  </div>

  <div v-if="isVisualEditingEnabled && page">
    <!-- If you're not using the visual editor it's safe to remove this element. Just a helper to let editors add edit / add new blocks to a page. -->
    <div class="relative">
      <UButton
        id="visual-editing-button"
        variant="ghost"
        :data-directus="
          setAttr({
            collection: 'pages',
            item: page.id,
            fields: ['blocks', 'meta_m2a_button'],
            mode: 'modal',
          })
        "
      >
        <Icon name="lucide:pencil" />
        Edit All Blocks
      </UButton>
    </div>
  </div>
</template>

<style>
.directus-visual-editing-overlay.visual-editing-button-class .directus-visual-editing-edit-button {
  /* Not using style scoped because the visual editor adds it's own elements to the page. Safe to remove this if you're not using the visual editor. */
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: none;
  background: transparent;
}
</style>
