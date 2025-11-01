<script setup lang="ts">
import type { Page, PageBlock } from '@turborepo-saas-starter/shared-types/schema';
import { withLeadingSlash, withoutTrailingSlash } from 'ufo';

const authStore = useAuthStore();
const route = useRoute();
const { enabled, state } = useLivePreview();
const pageUrl = useRequestURL();
const { isVisualEditingEnabled, apply, setAttr } = useVisualEditing();

// Determine which layout and content to show based on auth status
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.user?.role === 'admin');

// Redirect admin users to /admin
onMounted(() => {
  if (isAuthenticated.value && isAdmin.value) {
    navigateTo('/admin');
  }
});

// Set layout based on authentication
definePageMeta({
  layout: false, // We'll manually control the layout
});

// For authenticated non-admin users, we don't need to fetch the marketing page
const shouldFetchMarketingPage = computed(() => !isAuthenticated.value);

// Fetch marketing homepage from Directus (for both anonymous and authenticated users)
const permalink = '/';

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
  // Fetch for both authenticated and anonymous users
  immediate: true,
});

const pageBlocks = computed(() => (page.value?.blocks as PageBlock[]) || []);

// Filter to only show posts blocks for authenticated users
const postsBlocks = computed(() =>
  pageBlocks.value.filter(block => block.collection === 'block_posts')
);

// SEO Meta (only for marketing page)
if (page.value) {
  useSeoMeta({
    title: page.value?.seo?.title || page.value?.title || '',
    description: page.value?.seo?.meta_description || '',
    ogTitle: page.value?.seo?.title || page.value?.title || '',
    ogDescription: page.value?.seo?.meta_description || '',
    ogUrl: pageUrl.toString(),
  });
}

// Visual Editing helpers (for marketing page)
function applyVisualEditing() {
  apply({
    onSaved: async () => {
      await refresh();
    },
  });
}

function applyVisualEditingButton() {
  apply({
    elements: document.querySelector('#visual-editing-button') as HTMLElement,
    customClass: 'visual-editing-button-class',
    onSaved: async () => {
      await refresh();
      await nextTick();
      applyVisualEditing();
    },
  });
}

onMounted(() => {
  if (!isAuthenticated.value && isVisualEditingEnabled.value) {
    applyVisualEditingButton();
    applyVisualEditing();
  }
});
</script>

<template>
  <div>
    <!-- Marketing Homepage (Anonymous Users) -->
    <NuxtLayout v-if="!isAuthenticated" name="default">
      <div class="relative">
        <PageBuilder v-if="pageBlocks" :sections="pageBlocks" />
        <div
          v-if="isVisualEditingEnabled && page"
          class="fixed z-50 w-full bottom-4 left-0 right-0 p-4 flex justify-center items-center gap-2"
        >
          <UButton
            id="visual-editing-button"
            variant="outline"
            :data-directus="
              setAttr({ collection: 'pages', item: page.id, fields: ['blocks', 'meta_m2a_button'], mode: 'modal' })
            "
          >
            <Icon name="lucide:pencil" />
            Edit All Blocks
          </UButton>
        </div>
      </div>
    </NuxtLayout>

    <!-- Dashboard (Authenticated Users) -->
    <NuxtLayout v-else name="dashboard">
      <UDashboardPanel id="home">
        <template #body>
          <div class="relative">
            <!-- Show loading state -->
            <div v-if="!page && !error" class="flex items-center justify-center py-12">
              <p class="text-gray-500">Loading...</p>
            </div>

            <!-- Show error state -->
            <div v-else-if="error" class="flex items-center justify-center py-12">
              <p class="text-red-500">Error loading page: {{ error }}</p>
            </div>

            <!-- Show posts blocks if available -->
            <template v-else>
              <PageBuilder v-if="postsBlocks.length > 0" :sections="postsBlocks" />

              <!-- Fallback: if no posts blocks but page exists, show message -->
              <div v-else-if="page && pageBlocks.length > 0" class="flex flex-col items-center justify-center py-12 space-y-4">
                <Icon name="lucide:file-text" class="w-16 h-16 text-gray-400" />
                <p class="text-gray-500">No posts blocks found on this page.</p>
                <p class="text-sm text-gray-400">Add a posts block in Directus to see posts here.</p>
              </div>

              <!-- Fallback: if page has no blocks at all -->
              <div v-else-if="page && pageBlocks.length === 0" class="flex flex-col items-center justify-center py-12 space-y-4">
                <Icon name="lucide:file-text" class="w-16 h-16 text-gray-400" />
                <p class="text-gray-500">No blocks found on this page.</p>
              </div>

              <div
                v-if="isVisualEditingEnabled && page && postsBlocks.length > 0"
                class="fixed z-50 w-full bottom-4 left-0 right-0 p-4 flex justify-center items-center gap-2"
              >
                <UButton
                  id="visual-editing-button"
                  variant="outline"
                  :data-directus="
                    setAttr({ collection: 'pages', item: page.id, fields: ['blocks', 'meta_m2a_button'], mode: 'modal' })
                  "
                >
                  <Icon name="lucide:pencil" />
                  Edit All Blocks
                </UButton>
              </div>
            </template>
          </div>
        </template>
      </UDashboardPanel>
    </NuxtLayout>
  </div>
</template>

<style>
.directus-visual-editing-overlay.visual-editing-button-class .directus-visual-editing-edit-button {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: none;
  background: transparent;
}
</style>

