<script setup lang="ts">
/**
 * Gallery - Migrated to Nuxt UI
 * Uses UModal for lightbox with keyboard navigation
 */
interface GalleryItem {
  id: string;
  directus_file: string;
  sort?: number;
}

interface GalleryProps {
  data: {
    id: string;
    tagline?: string;
    headline?: string;
    items: GalleryItem[];
  };
}

const props = defineProps<GalleryProps>();

const isLightboxOpen = ref(false);
const currentIndex = ref(0);

const sortedItems = computed(() => {
  if (!props.data.items) return [];
  return [...props.data.items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
});

const currentItem = computed(() => {
  if (
    !sortedItems.value.length ||
    currentIndex.value < 0 ||
    currentIndex.value >= sortedItems.value.length
  ) {
    return null;
  }

  return sortedItems.value[currentIndex.value];
});

function handleOpenLightbox(index: number) {
  if (index >= 0 && index < sortedItems.value.length) {
    currentIndex.value = index;
    isLightboxOpen.value = true;
  }
}

function handlePrev() {
  if (!sortedItems.value.length) return;
  currentIndex.value =
    currentIndex.value > 0 ? currentIndex.value - 1 : sortedItems.value.length - 1;
}

function handleNext() {
  if (!sortedItems.value.length) return;
  currentIndex.value =
    currentIndex.value < sortedItems.value.length - 1 ? currentIndex.value + 1 : 0;
}

// Define keyboard shortcuts for lightbox
defineShortcuts({
  arrowleft: {
    usingInput: false,
    whenever: [isLightboxOpen],
    handler: () => handlePrev(),
  },
  arrowright: {
    usingInput: false,
    whenever: [isLightboxOpen],
    handler: () => handleNext(),
  },
  escape: {
    usingInput: false,
    whenever: [isLightboxOpen],
    handler: () => {
      isLightboxOpen.value = false;
    },
  },
});

const { setAttr } = useVisualEditing();
</script>

<template>
  <section class="relative">
    <Tagline
      v-if="data.tagline"
      :tagline="data.tagline"
      :data-directus="
        setAttr({ collection: 'block_gallery', item: data.id, fields: 'tagline', mode: 'popover' })
      "
    />
    <Headline
      v-if="data.headline"
      :headline="data.headline"
      :data-directus="
        setAttr({ collection: 'block_gallery', item: data.id, fields: 'headline', mode: 'popover' })
      "
    />

    <div
      v-if="sortedItems.length"
      class="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
      :data-directus="
        setAttr({ collection: 'block_gallery', item: data.id, fields: 'items', mode: 'modal' })
      "
    >
      <div
        v-for="(item, index) in sortedItems"
        :key="item.id"
        class="relative overflow-hidden rounded-lg group hover:shadow-lg transition-shadow duration-300 cursor-pointer h-[300px]"
        @click="handleOpenLightbox(index)"
      >
        <DirectusImage
          :uuid="item.directus_file"
          :alt="`Gallery item ${item.id}`"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          class="w-full h-full object-cover rounded-lg"
        />

        <div
          class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-60 dark:bg-opacity-60 opacity-0 group-hover:opacity-100 flex justify-center items-center transition-opacity duration-300"
        >
          <UIcon name="i-lucide-zoom-in" class="w-10 h-10 text-gray-800 dark:text-gray-200" />
        </div>
      </div>
    </div>

    <UModal
      v-model="isLightboxOpen"
      fullscreen
      :ui="{
        background: 'bg-black/90 dark:bg-black/95',
        width: 'w-screen max-w-none',
        height: 'h-screen',
        padding: 'p-0',
      }"
    >
      <div class="relative w-full h-full flex items-center justify-center p-4">
        <DirectusImage
          v-if="currentItem"
          :uuid="currentItem.directus_file"
          :alt="`Gallery item ${currentItem.id}`"
          class="max-w-full max-h-full object-contain"
        />

        <div
          v-if="sortedItems.length > 1"
          class="absolute bottom-8 inset-x-0 flex justify-between px-8"
        >
          <UButton
            icon="i-lucide-arrow-left"
            color="white"
            variant="solid"
            size="lg"
            @click="handlePrev"
          >
            Prev
          </UButton>
          <UButton
            trailing-icon="i-lucide-arrow-right"
            color="white"
            variant="solid"
            size="lg"
            @click="handleNext"
          >
            Next
          </UButton>
        </div>

        <UButton
          icon="i-lucide-x"
          color="white"
          variant="solid"
          size="lg"
          class="absolute top-8 right-8"
          square
          aria-label="Close Lightbox"
          @click="isLightboxOpen = false"
        />

        <div class="absolute top-8 left-8 text-white text-lg">
          {{ currentIndex + 1 }} / {{ sortedItems.length }}
        </div>
      </div>
    </UModal>
  </section>
</template>
