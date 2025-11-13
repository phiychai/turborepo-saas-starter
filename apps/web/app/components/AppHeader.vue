<script setup lang="ts">
import { LazySlideoverExample } from '#components';
const route = useRoute();
const authStore = useAuthStore();
const { isAuthenticated } = useAuth();

const items = computed(() => [
  {
    label: 'Docs',
    to: '/docs',
    active: route.path.startsWith('/docs'),
  },
  {
    label: 'Pricing',
    to: '/pricing',
  },
  {
    label: 'Blog',
    to: '/blog',
  },
  {
    label: 'Changelog',
    to: '/changelog',
    badge: {
      label: 'New',
      color: 'primary' as const,
    },
  },
]);

const headerUI = computed(() => {
  if (isAuthenticated.value) {
    return {
      container: 'max-w-none flex items-center justify-between gap-3 h-full',
    };
  }
  return undefined;
});
// Inject the sidebar open state from the layout
const collapsed = inject<Ref<boolean>>('sidebarCollapse', ref(false));
const slideoverOpen = inject<Ref<boolean>>('slideoverOpen', ref(false));

// Toggle function
const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
};

const toggleSlideover = () => {
  slideoverOpen.value = !slideoverOpen.value;
};
</script>

<template>
  <UHeader :ui="{ ...headerUI, right: 'gap-4' }">
    <template #left>
      <UButton
        v-if="isAuthenticated"
        icon="tabler:menu-2"
        color="neutral"
        variant="ghost"
        square
        class="flex ml-[-8px]"
        @click="toggleSidebar"
      />
      <NuxtLink to="/">
        <LogoPro class="w-auto h-6 shrink-0 ml-2" />
      </NuxtLink>
      <!-- <TemplateMenu /> -->
    </template>
    <UContentSearchButton
      :collapsed="false"
      v-if="isAuthenticated"
      class="w-full min-w-[480px]"
      variant="subtle"
      icon="tabler:search"
    />
    <UNavigationMenu :items="items" variant="link" v-else />

    <template #right v-if="!isAuthenticated">
      <!-- <UColorModeButton /> -->

      <UButton
        icon="tabler:door-exit"
        color="neutral"
        variant="ghost"
        to="/login"
        class="lg:hidden"
      />

      <UButton
        label="Sign in"
        color="neutral"
        variant="outline"
        to="/login"
        class="hidden lg:inline-flex"
      />

      <UButton
        label="Sign up"
        color="neutral"
        trailing-icon="tabler:arrow-right"
        class="hidden lg:inline-flex"
        to="/signup"
      />
    </template>
    <template #right v-else>
      <UPopover>
        <UButton
          label="Create"
          color="neutral"
          variant="subtle"
          icon="tabler:plus"
          class="rounded-full"
        />

        <template #content>
          <Placeholder class="size-48 m-4 inline-flex" />
        </template>
      </UPopover>
      <UPopover
        arrow
        :content="{
          align: 'end',
          side: 'bottom',
          sideOffset: 0,
        }"
      >
        <UButton icon="tabler:bell" color="neutral" variant="ghost" class="rounded-full" />
        <template #content>
          <UPageList divide>
            <UPageCard variant="ghost">
              <template #body> </template>
            </UPageCard>
          </UPageList>
        </template>
      </UPopover>

      <UserMenu :collapsed="true" />
    </template>
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />

      <USeparator class="my-6" />

      <UButton label="Sign in" color="neutral" variant="subtle" to="/login" block class="mb-3" />
      <UButton label="Sign up" color="neutral" to="/signup" block />
    </template>
  </UHeader>
</template>
