<script setup lang="ts">
/**
 * BaseButton - Migrated to Nuxt UI
 * Wrapper around UButton with support for pages, posts, and external URLs
 */
export interface ButtonProps {
  id: string;
  label?: string | null;
  variant?: string | null;
  url?: string | null;
  type?: 'page' | 'post' | 'url' | 'submit' | null;
  page?: { permalink: string | null };
  post?: { slug: string | null };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: 'arrow' | 'plus' | string;
  customIcon?: string;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  block?: boolean;
  target?: '_blank' | '_self' | '_parent' | '_top';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const props = withDefaults(defineProps<ButtonProps>(), {
  size: 'md',
  iconPosition: 'left',
  disabled: false,
  block: false,
  color: 'primary',
});

// Map old icon names to Iconify format
const iconMap: Record<string, string> = {
  arrow: 'i-lucide-arrow-right',
  plus: 'i-lucide-plus',
};

const buttonIcon = computed(() => {
  if (props.customIcon) return props.customIcon;
  if (props.icon && iconMap[props.icon]) return iconMap[props.icon];
  if (props.icon) return props.icon; // Already in iconify format
  return undefined;
});

const href = computed(() => {
  if (props.type === 'page' && props.page?.permalink) return props.page.permalink;
  if (props.type === 'post' && props.post?.slug) return `/blog/${props.post.slug}`;
  return props.url || undefined;
});

const isExternal = computed(() => {
  return href.value?.startsWith('http') || props.target === '_blank';
});

// Map variant to Nuxt UI variant/color
const buttonVariant = computed(() => {
  const variantMap: Record<string, string> = {
    default: 'solid',
    outline: 'outline',
    ghost: 'ghost',
    link: 'link',
    destructive: 'solid',
  };
  return variantMap[props.variant || 'default'] || 'solid';
});

const buttonColor = computed(() => {
  if (props.variant === 'destructive') return 'error';
  return props.color;
});
</script>

<template>
  <UButton
    :label="label || undefined"
    :size="size"
    :variant="buttonVariant"
    :color="buttonColor"
    :icon="iconPosition === 'left' ? buttonIcon : undefined"
    :trailing-icon="iconPosition === 'right' ? buttonIcon : undefined"
    :disabled="disabled"
    :block="block"
    :to="!isExternal && href ? href : undefined"
    :href="isExternal && href ? href : undefined"
    :target="target"
    :class="className"
    v-bind="$attrs"
  >
    <slot />
  </UButton>
</template>
