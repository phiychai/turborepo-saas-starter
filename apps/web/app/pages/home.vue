<script setup lang="ts">
const { isAuthenticated } = useAuth();

// Redirect to login if not authenticated
if (!isAuthenticated.value) {
  throw createError({ statusCode: 401, statusMessage: 'Unauthorized', fatal: true });
}

// Create data object for Posts component
const postsData = computed(() => ({
  id: 'posts-home',
  limit: 20,
  tagline: undefined,
  headline: 'Posts',
  posts: [], // Empty array - Posts component will fetch its own
}));

useSeoMeta({
  title: 'Home',
  description: 'Your dashboard',
});
</script>

<template>
  <UDashboardPanel class="pb-[64px]" variant="ghost">
    <Posts :data="postsData" />
  </UDashboardPanel>
</template>
