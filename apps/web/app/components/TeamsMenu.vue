<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const appInfo = {
  label: 'SaaS Starter',
  avatar: {
    src: 'https://ui-avatars.com/api/?name=SS&background=3b82f6&color=fff',
    alt: 'SaaS Starter'
  }
}
</script>

<template>
  <UButton
    v-bind="{
      ...appInfo,
      label: collapsed ? undefined : appInfo.label
    }"
    color="neutral"
    variant="ghost"
    block
    :square="collapsed"
    :class="[!collapsed && 'py-2']"
    disabled
  />
</template>
