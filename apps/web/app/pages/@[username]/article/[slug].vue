<script setup lang="ts">
import type { Post, DirectusUser } from '@turborepo-saas-starter/shared-types';
import { useTableOfContents } from '~/composables/useTableOfContents';
import { useReadingProgress } from '~/composables/useReadingProgress';

const route = useRoute();
const { enabled, state } = useLivePreview();
const { isVisualEditingEnabled, apply, setAttr } = useVisualEditing();
const postUrl = useRequestURL();
const loading = ref(false);

const username = route.params.username as string;
const slug = route.params.slug as string;
const { isAuthenticated } = useAuth();

const wrapperRef = ref<HTMLElement | null>(null);

const {
  public: { directusUrl },
} = useRuntimeConfig();

const { data, error, refresh } = await useFetch<{
  post: Post;
  relatedPosts: Post[];
}>(() => `/api/users/${username}/articles/${slug}`, {
  key: `article-${username}-${slug}`,
  query: {
    preview: enabled.value ? true : undefined,
    token: enabled.value ? state.token : undefined,
  },
});

if (!data.value || error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true });
}

const post = computed(() => data.value?.post);
const relatedPosts = computed(() => data.value?.relatedPosts);
const author = computed(() => post.value?.author as Partial<DirectusUser>);

// Reading progress tracking
const { articleContentRef, readingProgress } = useReadingProgress();

// Slideover state for comments/chat
const commentsSlideoverOpen = ref(false);

// Generate TOC from post content
const { tocLinks } = useTableOfContents(() => post.value?.content || null);
onMounted(() => {
  loading.value = false;
  if (!isVisualEditingEnabled.value) return;
  apply({
    onSaved: () => refresh(),
  });
});

useSeoMeta({
  title: post.value?.seo?.title || post.value?.title,
  description: post.value?.seo?.meta_description || post.value?.description,
  ogTitle: post.value?.seo?.title || post.value?.title,
  ogDescription: post.value?.seo?.meta_description || post.value?.description,
  ogUrl: postUrl.toString(),
});
</script>
<template>
  <UDashboardPanel id="post" class="pb-[64px]">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UButton
            icon="tabler:x"
            class="mr-3"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="navigateTo(`/@${username}`)"
          />
        </template>
        <template #default> <span class="text-muted" /></template>
        <template #right>
          <UButton icon="tabler:dots" variant="ghost" color="neutral" size="sm" />
          <UButton
            icon="tabler:layout-sidebar-inactive"
            variant="ghost"
            color="neutral"
            size="sm"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UContainer v-if="post" ref="articleContentRef" class="max-w-[680px]">
        <UPageHeader
          :title="post.title"
          :description="post.description || undefined"
          :data-directus="
            setAttr({
              collection: 'posts',
              item: post.id,
              fields: ['headline', 'description'],
              mode: 'popover',
            })
          "
        >
          <template #headline>
            <UBadge
              v-for="(category, index) in post.categories || []"
              :key="typeof category === 'string' ? category : category.id || index"
              variant="subtle"
            >
              {{
                typeof category === 'string'
                  ? category
                  : (category as any).title || category.name || category
              }}
            </UBadge>
            <span v-if="post.published_at" class="text-muted">&middot;</span>
            <time v-if="post.published_at" class="text-muted">
              {{
                new Date(post.published_at).toLocaleDateString('en', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              }}
            </time>
          </template>
          <div class="flex flex-wrap items-center gap-3 mt-4">
            <UButton color="neutral" variant="subtle" target="_blank" size="sm">
              <template v-if="author && typeof author !== 'string'">
                {{ author.first_name }}{{ author.last_name }}
              </template>
              <template v-else>
                {{ author || 'Unknown Author' }}
              </template>
            </UButton>
            <UButton
              icon="tabler:bookmark"
              size="sm"
              class="ml-2"
              variant="ghost"
              color="neutral"
            />
            <USlideover
              v-model:open="commentsSlideoverOpen"
              title="Comments"
              description="Join the discussion"
              side="right"
            >
              <UButton icon="tabler:message-circle" size="sm" color="neutral" variant="ghost" />
            </USlideover>
          </div>
        </UPageHeader>

        <UPage>
          <UPageBody>
            <Text
              v-if="post.content"
              :content="post.content"
              :data-directus="
                setAttr({ collection: 'posts', item: post.id, fields: ['content'], mode: 'drawer' })
              "
            />
            <div v-else class="text-center text-muted py-8">
              <p>No content available for this post.</p>
            </div>

            <USeparator class="my-8" />

            <div v-if="relatedPosts?.length">
              <h3 class="font-bold mb-4">Related Articles</h3>
              <div class="space-y-4">
                <NuxtLink
                  v-for="relatedPost in relatedPosts"
                  :key="relatedPost.id"
                  :to="`/@${username}/article/${relatedPost.slug}`"
                  class="flex items-center space-x-4 hover:text-accent group"
                >
                  <div
                    v-if="relatedPost.image"
                    class="relative shrink-0 w-[150px] h-[100px] overflow-hidden rounded-lg"
                  >
                    <DirectusImage
                      :uuid="relatedPost.image as string"
                      :alt="relatedPost.title || 'related post image'"
                      class="object-cover transition-transform duration-300 group-hover:scale-110"
                      fill
                      sizes="(max-width: 768px) 100px, (max-width: 1024px) 150px, 150px"
                    />
                  </div>
                  <span class="font-heading">{{ relatedPost.title }}</span>
                </NuxtLink>
              </div>
            </div>
          </UPageBody>
          <template v-if="tocLinks.length" #left>
            <UContentToc :links="tocLinks" />
          </template>
        </UPage>
      </UContainer>

      <div v-else class="text-center text-xl mt-[20%]">404 - Article Not Found</div>
    </template>
  </UDashboardPanel>
</template>
