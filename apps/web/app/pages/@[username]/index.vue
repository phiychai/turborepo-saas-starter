<script setup lang="ts">
import type { Space, Post } from '@turborepo-saas-starter/shared-types/schema';

const route = useRoute();
const username = route.params.username as string;

const { data, error } = await useFetch<{
  user: {
    id: number;
    username: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
    avatarUrl: string | null;
    bio: string | null;
    email: string;
  };
  spaces: Space[];
  recentPosts: Post[];
}>(() => `/api/users/${username}`, {
  key: `user-profile-${username}`,
});

if (error.value) {
  const statusCode = error.value.statusCode || error.value.status || 404;
  const message = error.value.message || error.value.statusMessage || 'User not found';
  throw createError({ statusCode, statusMessage: message, fatal: true });
}

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `User "${username}" not found`,
    fatal: true,
  });
}

const user = computed(() => data.value?.user);
const spaces = computed(() => data.value?.spaces || []);
const recentPosts = computed(() => data.value?.recentPosts || []);

const displayName = computed(
  () => user.value?.fullName || user.value?.username || user.value?.email?.split('@')[0] || 'User'
);

useSeoMeta({
  title: `${displayName.value} - Profile`,
  description: user.value?.bio || `View ${displayName.value}'s spaces and articles`,
  ogTitle: `${displayName.value} - Profile`,
  ogDescription: user.value?.bio || `View ${displayName.value}'s spaces and articles`,
});
</script>

<template>
  <UDashboardPanel class="pb-[64px]">
    <template #header>
      <UDashboardNavbar :title="displayName" :ui="{ right: 'gap-3' }">
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
      </UDashboardNavbar>
    </template>
    <template #body>
      <UContainer class="max-w-[680px]">
        <!-- User Profile Header -->
        <div class="mb-8">
          <div class="flex items-start gap-6 mb-6">
            <div v-if="user?.avatarUrl" class="flex-shrink-0">
              <img
                :src="user.avatarUrl"
                :alt="displayName"
                class="w-24 h-24 rounded-full object-cover border-2 border-default"
              />
            </div>
            <div v-else class="flex-shrink-0">
              <div
                class="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold"
              >
                {{ displayName.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold mb-2">{{ displayName }}</h1>
              <p v-if="user?.bio" class="text-muted text-lg mb-4">{{ user.bio }}</p>
              <div class="flex items-center gap-4 text-sm text-muted">
                <span>@{{ username }}</span>
                <span v-if="spaces.length" class="flex items-center gap-1">
                  <Icon name="tabler:folder" class="w-4 h-4" />
                  {{ spaces.length }} {{ spaces.length === 1 ? 'space' : 'spaces' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Spaces Section -->
        <div v-if="spaces.length" class="mb-12">
          <h2 class="text-2xl font-bold mb-4">Spaces</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NuxtLink
              v-for="space in spaces"
              :key="space.id"
              :to="`/@${username}/${space.slug}`"
              class="block"
            >
              <UCard class="hover:shadow-lg transition-shadow">
                <div class="p-4">
                  <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-semibold">{{ space.name }}</h3>
                    <UBadge v-if="space.is_default" variant="subtle" size="xs" color="primary">
                      Default
                    </UBadge>
                  </div>
                  <p v-if="space.description" class="text-sm text-muted mb-2">
                    {{ space.description }}
                  </p>
                  <div class="flex items-center gap-2 text-xs text-muted">
                    <Icon name="tabler:folder" class="w-3 h-3" />
                    <span>/{{ space.slug }}</span>
                  </div>
                </div>
              </UCard>
            </NuxtLink>
          </div>
        </div>

        <!-- Recent Posts Section -->
        <div v-if="recentPosts.length" class="mb-12">
          <h2 class="text-2xl font-bold mb-4">Recent Posts</h2>
          <div class="space-y-6">
            <div
              v-for="post in recentPosts"
              :key="post.id"
              class="border-b border-default pb-6 last:border-0"
            >
              <NuxtLink
                :to="
                  post.space && typeof post.space !== 'string' && post.space.is_default
                    ? `/@${username}/article/${post.slug}`
                    : `/@${username}/${typeof post.space !== 'string' ? post.space?.slug : 'article'}/${post.slug}`
                "
                class="block hover:text-accent group"
              >
                <div class="flex gap-4">
                  <div v-if="post.image" class="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden">
                    <DirectusImage
                      :uuid="post.image as string"
                      :alt="post.title || 'Post image'"
                      class="object-cover w-full h-full"
                      width="128"
                      height="96"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        v-if="post.space && typeof post.space !== 'string'"
                        class="text-xs text-muted"
                      >
                        {{ post.space.name }}
                      </span>
                    </div>
                    <h3 class="text-xl font-bold mb-2 group-hover:underline line-clamp-2">
                      {{ post.title }}
                    </h3>
                    <p v-if="post.description" class="text-muted mb-2 line-clamp-2">
                      {{ post.description }}
                    </p>
                    <div class="flex items-center gap-2 text-sm text-muted">
                      <time v-if="post.published_at">
                        {{
                          new Date(post.published_at).toLocaleDateString('en', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        }}
                      </time>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!spaces.length && !recentPosts.length" class="text-center py-12">
          <Icon name="tabler:user" class="w-16 h-16 text-muted mx-auto mb-4" />
          <p class="text-muted text-lg">No spaces or posts yet.</p>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
