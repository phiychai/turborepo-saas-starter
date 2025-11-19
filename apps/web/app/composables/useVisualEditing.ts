import { apply as applyVisualEditing, setAttr } from '@directus/visual-editing';
import type { ApplyOptions } from '~/types/composables';
export default function useVisualEditing() {
  // Use useState for state that persists across navigation
  const isVisualEditingEnabled = useState('visual-editing-enabled', () => false);
  const route = useRoute();
  const {
    public: { enableVisualEditing, directusUrl },
  } = useRuntimeConfig();

  // Check query param on composable initialization.
  if (route.query['visual-editing'] === 'true' && enableVisualEditing) {
    isVisualEditingEnabled.value = true;
  } else if (route.query['visual-editing'] === 'false') {
    isVisualEditingEnabled.value = false;
  }

  const apply = (options: Pick<ApplyOptions, 'elements' | 'onSaved' | 'customClass'>) => {
    if (!isVisualEditingEnabled.value) return;
    // Type assertion needed due to @directus/visual-editing type mismatch
    applyVisualEditing({
      ...options,
      directusUrl,
    } as Parameters<typeof applyVisualEditing>[0]);
  };

  return {
    isVisualEditingEnabled,
    apply,
    setAttr,
  };
}
