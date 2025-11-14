<script setup lang="ts">
/**
 * SearchModel - Migrated to Nuxt UI
 * Uses UCommandPalette for search with keyboard shortcuts
 */
import { ref, computed } from 'vue';
import { useDebounceFn } from '@vueuse/core';

type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: string;
  link: string;
  content: string;
};

const router = useRouter();
const isOpen = ref(false);
const query = ref('');
const results = ref<SearchResult[]>([]);
const loading = ref(false);
const searched = ref(false);

const fetchResults = async (search: string) => {
  if (search.length < 3) {
    results.value = [];
    searched.value = false;
    return;
  }

  loading.value = true;
  searched.value = true;

  try {
    const data = await $fetch<SearchResult[]>('/api/search', {
      params: { search },
    });

    results.value = [...data];
  } catch {
    results.value = [];
  } finally {
    loading.value = false;
  }
};

const debouncedFetchResults = useDebounceFn(fetchResults, 300);

// Map results to command palette format
const groups = computed(() => {
  if (loading.value) {
    return [
      {
        key: 'loading',
        label: 'Searching...',
        commands: [],
      },
    ];
  }

  if (!searched.value) {
    return [
      {
        key: 'empty',
        label: 'Start typing to search',
        commands: [],
      },
    ];
  }

  if (results.value.length === 0) {
    return [
      {
        key: 'no-results',
        label: 'No results found',
        commands: [],
      },
    ];
  }

  return [
    {
      key: 'results',
      label: 'Search Results',
      commands: results.value.map((result) => ({
        id: result.id,
        label: result.title,
        suffix: result.type,
        description: result.description,
        icon: 'i-lucide-file-text',
        to: result.link,
        click: () => {
          router.push(result.link);
          isOpen.value = false;
        },
      })),
    },
  ];
});

// Define keyboard shortcut
defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      isOpen.value = !isOpen.value;
    },
  },
  ctrl_k: {
    usingInput: true,
    handler: () => {
      isOpen.value = !isOpen.value;
    },
  },
});

// Watch query changes
watch(query, (newQuery) => {
  debouncedFetchResults(newQuery);
});

// Reset on close
watch(isOpen, (open) => {
  if (!open) {
    query.value = '';
    results.value = [];
    searched.value = false;
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <UButton
      variant="ghost"
      icon="i-lucide-search"
      size="sm"
      aria-label="Search"
      @click="isOpen = true"
    />

    <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCommandPalette
        v-model="query"
        nullable
        :groups="groups"
        :loading="loading"
        placeholder="Search for pages or posts..."
        :ui="{
          input: {
            wrapper: 'border-b border-gray-200 dark:border-gray-800',
            base: 'text-base',
          },
        }"
      />
    </UModal>
  </div>
</template>
