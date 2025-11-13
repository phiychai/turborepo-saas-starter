import { ref, watch, type Ref } from 'vue';

export interface TocLink {
  id: string;
  text: string;
  depth: number;
  children?: TocLink[];
}

export function useTableOfContents(
  content: Ref<string | null | undefined> | (() => string | null | undefined)
) {
  const tocLinks = ref<TocLink[]>([]);

  function generateToc(content: string): TocLink[] {
    if (!content) return [];

    const lines = content.split('\n');
    const headings: TocLink[] = [];
    const stack: TocLink[] = [];

    for (const line of lines) {
      // Match markdown headings (## Heading or ### Heading, etc.)
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match && match[1] && match[2]) {
        const depth = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const link: TocLink = { id, text, depth };

        // Build hierarchy
        while (stack.length > 0) {
          const lastItem = stack[stack.length - 1];
          if (lastItem && lastItem.depth >= depth) {
            stack.pop();
          } else {
            break;
          }
        }

        if (stack.length === 0) {
          headings.push(link);
          stack.push(link);
        } else {
          const parent = stack[stack.length - 1];
          if (parent) {
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(link);
            stack.push(link);
          }
        }
      }
    }

    return headings;
  }

  // Watch for content changes and regenerate TOC
  watch(
    typeof content === 'function' ? content : () => content.value,
    (contentValue) => {
      if (contentValue) {
        tocLinks.value = generateToc(contentValue);
      } else {
        tocLinks.value = [];
      }
    },
    { immediate: true }
  );

  return {
    tocLinks,
    generateToc, // Expose for manual generation if needed
  };
}

