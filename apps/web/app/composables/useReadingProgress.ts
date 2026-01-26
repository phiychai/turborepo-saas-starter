import { ref, computed } from 'vue';
import { useWindowScroll, useWindowSize, useElementBounding } from '@vueuse/core';

export interface ReadingProgressOptions {
  /** Fixed header height in pixels (default: 64) */
  fixedHeaderHeight?: number;
  /** Navbar height in pixels (default: 64) */
  navbarHeight?: number;
}

export function useReadingProgress(options: ReadingProgressOptions = {}) {
  const { fixedHeaderHeight = 64, navbarHeight = 64 } = options;

  const articleContentRef = ref<HTMLElement | null>(null);
  const navbarRef = ref<HTMLElement | null>(null);

  const { y: scrollY } = useWindowScroll();
  const windowHeight = useWindowSize().height;

  const articleBounding = useElementBounding(articleContentRef);
  const navbarBounding = useElementBounding(navbarRef);

  const readingProgress = computed(() => {
    if (!articleContentRef.value || !articleBounding.height.value) return 0;

    const articleTop = articleBounding.top.value;
    const articleHeight = articleBounding.height.value;

    // Total fixed height (header + navbar)
    const totalFixedHeight = fixedHeaderHeight + navbarHeight;

    // Article position relative to the effective viewport start (below fixed elements)
    const relativeTop = articleTop + totalFixedHeight;

    // How much has been scrolled past the article start
    const scrolled = Math.max(0, -relativeTop);

    // Calculate progress
    const progress = (scrolled / articleHeight) * 100;

    return Math.min(100, Math.max(0, progress));
  });

  return {
    articleContentRef,
    navbarRef,
    readingProgress,
    scrollY,
    windowHeight,
    articleBounding,
    navbarBounding,
  };
}
