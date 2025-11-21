<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

defineProps<{
  collapsed?: boolean;
}>();

const colorMode = useColorMode();
const appConfig = useAppConfig();
const router = useRouter();
const { user: authUser, logout } = useAuth();

const colors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone'];

const user = computed(() => ({
  name: authUser.value?.fullName || authUser.value?.email || 'User',
  avatar: {
    src: ``,
    alt: authUser.value?.firstName || 'User',
  },
}));

const profileUrl = computed(() => {
  if (authUser.value?.username) {
    return `/@${authUser.value.username}`;
  }
  // Fallback to settings/profile if no username
  return '/settings';
});

const handleLogout = async () => {
  await logout();
  router.push('/');
};

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: user.value.name,
      avatar: user.value.avatar,
    },
  ],
  [
    {
      label: 'Admin',
      icon: 'tabler:user',
      to: '/admin',
    },
    {
      label: 'Billing',
      icon: 'i-lucide-credit-card',
      to: '/settings',
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
  ],
  [
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault();

            colorMode.preference = 'light';
          },
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'dark';
            }
          },
          onSelect(e: Event) {
            e.preventDefault();
          },
        },
      ],
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'tabler:logout',
      onSelect: handleLogout,
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 20 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated text-lg rounded-full"
      :class="collapsed ? 'w-auto' : 'w-full'"
      :ui="{
        trailingIcon: 'text',
      }"
    />

    <template #chip-leading="{ item }: { item: Record<string, unknown> }">
      <span
        :style="{
          '--chip-light': `var(--color-${'chip' in item && typeof item.chip === 'string' ? item.chip : 'neutral'}-500)`,
          '--chip-dark': `var(--color-${'chip' in item && typeof item.chip === 'string' ? item.chip : 'neutral'}-400)`,
        }"
        class="ms-0.5 size-2 rounded-full bg-(--chip-light) dark:bg-(--chip-dark)"
      />
    </template>
  </UDropdownMenu>
</template>
