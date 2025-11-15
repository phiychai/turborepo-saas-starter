<script setup lang="ts">
import type { Post, DirectusUser } from '@turborepo-saas-starter/shared-types';
import { useTableOfContents } from '~/composables/useTableOfContents';

const route = useRoute();
const { enabled, state } = useLivePreview();
const { isVisualEditingEnabled, apply, setAttr } = useVisualEditing();
const postUrl = useRequestURL();
const loading = ref(false);

const slug = route.params.slug as string;
const { isAuthenticated } = useAuth();

const wrapperRef = ref<HTMLElement | null>(null);

const {
  public: { directusUrl },
} = useRuntimeConfig();

const { data, error, refresh } = await useFetch<{
  post: Post;
  relatedPosts: Post[];
}>(() => `/api/posts/${slug}`, {
  key: `posts-${slug}`,
  query: {
    preview: enabled.value ? true : undefined,
    token: enabled.value ? state.token : undefined,
  },
});

if (!data.value || error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true });
}

const post = computed(() => data.value?.post);
const relatedPosts = computed(() => data.value?.relatedPosts);
const author = computed(() => post.value?.author as Partial<DirectusUser>);

// Reading progress tracking with VueUse
const articleContentRef = ref<HTMLElement | null>(null);
const navbarRef = ref<HTMLElement | null>(null);

const { y: scrollY } = useWindowScroll();
const windowHeight = useWindowSize().height;

// Get bounding boxes for article and navbar
const articleBounding = useElementBounding(articleContentRef);
const navbarBounding = useElementBounding(navbarRef);

// Fixed header height (from layout: margin-top: 64px)
const fixedHeaderHeight = 64;
const navbarHeight = 64;
const readingProgress = computed(() => {
  if (!articleContentRef.value || !articleBounding.height.value) return 0;

  const articleTop = articleBounding.top.value;
  const articleHeight = articleBounding.height.value;

  const viewportHeight = windowHeight.value;

  // Total fixed height (header + navbar)
  const totalFixedHeight = fixedHeaderHeight + navbarHeight;

  // Article position relative to the effective viewport start (below fixed elements)
  const relativeTop = articleTop + totalFixedHeight;

  // How much has been scrolled past the article start
  // When relativeTop becomes negative, we've scrolled past the start
  const scrolled = Math.max(0, -relativeTop);

  // Calculate progress
  const progress = (scrolled / articleHeight) * 100;

  return Math.min(100, Math.max(0, progress));
});

// Slideover state for comments/chat
const commentsSlideoverOpen = ref(false);

// Dummy comments data
interface Comment {
  id: string;
  role: 'user';
  parts: Array<{ type: 'text'; id: string; text: string }>;
  avatar?: { src?: string; icon?: string; alt: string };
  author: string;
  date: string;
}

const comments = ref<Comment[]>([
  {
    id: '1',
    role: 'user',
    parts: [
      {
        type: 'text',
        id: '1-1',
        text: 'Great article! Really enjoyed reading about AI coding assistants.',
      },
    ],
    avatar: { src: 'https://github.com/benjamincanac.png', alt: 'Sarah Chen' },
    author: 'Sarah Chen',
    date: '2 hours ago',
  },
  {
    id: '2',
    role: 'user',
    parts: [
      {
        type: 'text',
        id: '2-1',
        text: "I've been using GitHub Copilot for a few months now and it's been a game changer. The code suggestions are surprisingly accurate!",
      },
    ],
    avatar: { src: 'https://github.com/Atinux.png', alt: 'Alex Rodriguez' },
    author: 'Alex Rodriguez',
    date: '5 hours ago',
  },
  {
    id: '3',
    role: 'user',
    parts: [
      {
        type: 'text',
        id: '3-1',
        text: "Does anyone have experience with ChatGPT for code review? I'm curious how it compares to Copilot.",
      },
    ],
    avatar: { icon: 'i-lucide-user', alt: 'Mike Johnson' },
    author: 'Mike Johnson',
    date: '1 day ago',
  },
  {
    id: '4',
    role: 'user',
    parts: [
      {
        type: 'text',
        id: '4-1',
        text: 'The productivity gains mentioned here are real. My team has seen about 40% faster development cycles since adopting AI tools.',
      },
    ],
    avatar: { src: 'https://github.com/santoshyadavdev.png', alt: 'Emily Davis' },
    author: 'Emily Davis',
    date: '2 days ago',
  },
]);

const newComment = ref('');
const isSubmitting = ref(false);

function submitComment() {
  if (!newComment.value.trim()) return;

  isSubmitting.value = true;

  // Simulate API call
  setTimeout(() => {
    comments.value.unshift({
      id: String(Date.now()),
      role: 'user',
      parts: [{ type: 'text', id: `${Date.now()}-1`, text: newComment.value }],
      avatar: { icon: 'i-lucide-user', alt: 'You' },
      author: 'You',
      date: 'Just now',
    });

    newComment.value = '';
    isSubmitting.value = false;
  }, 500);
}

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
      <!-- <div
        class="absolute inset-0 bg-primary/5 transition-all duration-150 ease-out pointer-events-none h-[64px]"
        :style="{ width: `${readingProgress}%` }"
      /> -->
      <UDashboardNavbar title="The Schelling Zone" :ui="{ right: 'gap-3' }">
        <!-- Progress bar background -->

        <template #leading>
          <UButton
            icon="tabler:x"
            class="mr-3"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="navigateTo('/')"
          />
        </template>
        <template #default> <span class="text-muted" /></template>
        <template #right>
          <UButton icon="tabler:dots" variant="ghost" color="neutral" size="sm" />
          <!-- <UButton icon="tabler:edit" variant="ghost" color="neutral" size="sm" /> -->

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
              <!-- <UAvatar v-bind="post.author.avatar" alt="Author avatar" size="2xs" /> -->

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
              <UButton icon="tabler:message-dots" size="sm" color="neutral" variant="ghost" />
              <template #body>
                <div class="flex flex-col h-full">
                  <div class="flex-1 overflow-y-auto p-4">
                    <div class="space-y-4">
                      <UChatMessage
                        v-for="comment in comments"
                        :id="comment.id"
                        :key="comment.id"
                        :role="comment.role"
                        :parts="comment.parts"
                        :avatar="comment.avatar"
                        side="right"
                        variant="soft"
                        :ui="{
                          container: 'max-w-full w-full !ms-0',
                          content: 'w-full',
                        }"
                      >
                        <template #content>
                          <div class="space-y-1 w-full">
                            <p class="text-sm whitespace-pre-wrap">{{ comment.parts[0]?.text }}</p>
                            <div class="flex items-center gap-2 text-xs text-muted">
                              <span class="font-medium">{{ comment.author }}</span>
                              <span>·</span>
                              <span>{{ comment.date }}</span>
                            </div>
                          </div>
                        </template>
                      </UChatMessage>
                    </div>
                  </div>

                  <div class="border-t border-default p-4">
                    <form class="space-y-3" @submit.prevent="submitComment">
                      <UTextarea
                        v-model="newComment"
                        placeholder="Write a comment..."
                        :rows="3"
                        :disabled="isSubmitting"
                        autoresize
                        required
                      />
                      <div class="flex justify-end">
                        <UButton
                          type="submit"
                          :loading="isSubmitting"
                          :disabled="!newComment.trim()"
                          label="Post comment"
                          icon="i-lucide-send"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </template>
            </USlideover>
          </div>
        </UPageHeader>

        <!-- <div v-if="post.image" class="mb-8 w-full">
			<div
				class="relative w-full h-[400px] overflow-hidden rounded-lg"
				:data-directus="setAttr({ collection: 'posts', item: post.id, fields: ['image'], mode: 'modal' })"
			>
				<DirectusImage
					:uuid="post.image as string"
					:alt="post.title || 'post header image'"
					class="object-cover w-full h-full"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
					fill
				/>
			</div>
		</div> -->

        <UPage>
          <UPageBody>
            <!-- <ContentRenderer v-if="post" :value="post.content" /> -->
            <!-- <UContentSurround :surround="surround" /> -->

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
              <h3 class="font-bold mb-4">Related Posts</h3>
              <div class="space-y-4">
                <NuxtLink
                  v-for="relatedPost in relatedPosts"
                  :key="relatedPost.id"
                  :to="`/blog/${relatedPost.slug}`"
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

      <div v-else class="text-center text-xl mt-[20%]">404 - Post Not Found</div>
    </template>
  </UDashboardPanel>
</template>
