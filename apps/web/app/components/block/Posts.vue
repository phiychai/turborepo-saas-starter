<script setup lang="ts">
/**
 * Posts - Migrated to Nuxt UI
 * Uses UPagination for pagination controls
 */
import { formatDistanceToNow } from 'date-fns';
import type { Post, DirectusFile, DirectusUser } from '~turborepo-saas-starter/shared-types/schema';
import type { PostsProps } from '~/types/components';

const props = defineProps<PostsProps>();

const route = useRoute();
const router = useRouter();

const perPage = props.data.limit || 12;
const currentPage = ref(Number(route.query.page) || 1);

const selectedCategory = computed(() => (route.query.category as string) || undefined);

const { data: postsData, error } = await useFetch<{
  posts: Post[];
  count: number;
}>('/api/posts', {
  key: `block-posts-${props.data?.id}-${currentPage.value}-${selectedCategory.value || 'all'}`,
  query: {
    page: currentPage,
    limit: perPage,
    category: selectedCategory.value,
  },
  watch: [currentPage, selectedCategory],
  onResponseError({ response }) {
    console.error('Error fetching posts:', response.status, response.statusText, response._data);
  },
});

const posts = computed(() => postsData.value?.posts || []);
const totalPages = computed(() => Math.ceil((postsData.value?.count || 0) / perPage));

function handlePageChange(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    router.push({ query: { page } });
  }
}

// Fetch all categories for navigation menu
const { data: categoriesData, error: categoriesError } = await useFetch<{
  categories: Array<{ id: string; name: string; slug: string }>;
}>('/api/posts/categories', {
  key: 'posts-categories',
  onResponseError({ response }) {
    console.error(
      'Error fetching categories:',
      response.status,
      response.statusText,
      response._data
    );
  },
});

// Fallback: Extract unique categories from posts if categories API fails
const categoriesFromPosts = computed(() => {
  if (categoriesData.value?.categories && categoriesData.value.categories.length > 0) {
    return categoriesData.value.categories;
  }

  // Extract categories from posts categories field as fallback
  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();

  if (posts.value) {
    posts.value.forEach((post) => {
      if (post.categories) {
        const postCategories = Array.isArray(post.categories) ? post.categories : [];
        postCategories.forEach(
          (cat: string | { id: string; title?: string | null; slug?: string | null }) => {
            if (typeof cat === 'string') {
              // If it's a string, create a category from it
              const slug = cat.toLowerCase().replace(/\s+/g, '-');
              if (!categoryMap.has(slug)) {
                categoryMap.set(slug, {
                  id: slug,
                  name: cat,
                  slug,
                });
              }
            } else if (typeof cat === 'object' && cat !== null && 'id' in cat && 'title' in cat) {
              // If it's an object with id and title
              const category = {
                id: String(cat.id),
                name: String(cat.title || ''),
                slug: cat.slug
                  ? String(cat.slug)
                  : String(cat.title || '')
                      .toLowerCase()
                      .replace(/\s+/g, '-'),
              };
              if (category.id && category.name && !categoryMap.has(category.id)) {
                categoryMap.set(category.id, category);
              }
            }
          }
        );
      }
    });
  }

  return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
});

// Debug: Log categories data
watch(
  [categoriesData, categoriesFromPosts],
  ([data, fromPosts]) => {
    console.log('Categories from API:', data?.categories?.length || 0);
    console.log('Categories from posts:', fromPosts.length);
  },
  { immediate: true }
);

// Function to handle category filter clicks
function handleCategoryClick(categorySlug: string | undefined) {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      category: categorySlug,
      page: 1, // Reset to first page when filtering
    },
  });
}

// Create navigation menu items from categories
const items = computed(() => {
  const menuItems: Array<{
    label: string;
    active: boolean;
    click: () => void;
  }> = [
    {
      label: 'All',
      active: !route.query.category,
      click: () => handleCategoryClick(undefined),
    },
  ];

  // Use categories from API if available, otherwise use categories extracted from posts
  const categoriesToUse = categoriesFromPosts.value;

  if (categoriesToUse && categoriesToUse.length > 0) {
    const categoryItems = categoriesToUse.map((category) => ({
      label: category.name,
      active: route.query.category === category.slug,
      click: () => handleCategoryClick(category.slug),
    }));

    menuItems.push(...categoryItems);
  }

  return menuItems;
});

const { setAttr } = useVisualEditing();
const {
  public: { directusUrl },
} = useRuntimeConfig();

// Helper function to convert Directus image to URL
function getImageUrl(image: string | DirectusFile | null | undefined): string | undefined {
  if (!image) return undefined;

  if (typeof image === 'string') {
    return `${directusUrl}/assets/${image}`;
  }

  return `${directusUrl}/assets/${image.id}`;
}

// Transform posts to include image URLs and properly formatted authors
const postsWithImageUrls = computed(() =>
  posts.value.map((post) => {
    const imageUrl = getImageUrl(post.image);
    const author = post.author && typeof post.author === 'object' ? post.author : null;
    const authorAvatarUrl = author ? getImageUrl(author.avatar) : undefined;

    return {
      ...post,
      imageUrl,
      author: author
        ? {
            ...author,
            avatar: authorAvatarUrl
              ? {
                  src: authorAvatarUrl,
                  alt: `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Author',
                }
              : undefined,
          }
        : undefined,
    };
  })
);
const feedOrientation = ref<'vertical' | 'horizontal'>('horizontal');
</script>
<template>
  <UDashboardNavbar :ui="{ right: 'gap-3' }" class="border-b-0">
    <template #left> <UNavigationMenu :items="items" color="neutral" /></template>
  </UDashboardNavbar>
  <UContainer ref="articleContentRef" class="max-w-none overflow-auto pt-4">
    <!-- Show error if posts failed to load -->
    <div v-if="error" class="flex items-center justify-center py-12">
      <UAlert
        color="error"
        variant="soft"
        title="Error loading posts"
        :description="error.message || 'Failed to fetch posts'"
      />
    </div>
    <!-- Show empty state if no posts -->
    <div v-else-if="postsWithImageUrls.length === 0" class="flex items-center justify-center py-12">
      <UAlert
        color="neutral"
        variant="soft"
        title="No posts found"
        description="There are no published posts available at this time."
      />
    </div>
    <!-- Show posts -->
    <UBlogPosts v-else :orientation="feedOrientation">
      <UBlogPost
        v-for="(post, index) in postsWithImageUrls"
        :key="post.id"
        :to="`/blog/${post.slug}`"
        :title="post.title"
        :description="post.description || undefined"
        :image="post.imageUrl"
        :date="
          post.published_at
            ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
            : undefined
        "
        :authors="
          post.author && typeof post.author === 'object'
            ? [
                {
                  name: `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim(),
                  avatar: post.author.avatar, // Use the already-transformed value
                },
              ]
            : undefined
        "
        :badge="
          post.categories && post.categories.length > 0
            ? {
                label:
                  typeof post.categories[0] === 'string'
                    ? post.categories[0]
                    : post.categories[0]?.title || post.categories[0]?.name || '',
              }
            : undefined
        "
        :orientation="index === 0 ? 'horizontal' : 'vertical'"
        :class="[index === 0 && 'col-span-full']"
        :ui="{
          description: 'line-clamp-2',
        }"
      />
    </UBlogPosts>
  </UContainer>
</template>
