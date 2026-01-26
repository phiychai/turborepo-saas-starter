import { ref } from 'vue';

export interface BlogComment {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; id: string; text: string }>;
  avatar?: { src?: string; icon?: string; alt: string };
  author: string;
  date: string;
}

export interface UseCommentsReturn {
  comments: Ref<BlogComment[]>;
  newComment: Ref<string>;
  isSubmitting: Ref<boolean>;
  submitComment: () => void;
}

export function useComments(initialComments: BlogComment[] = []): UseCommentsReturn {
  const comments = ref<BlogComment[]>(initialComments);
  const newComment = ref('');
  const isSubmitting = ref(false);

  function submitComment() {
    if (!newComment.value.trim()) return;

    isSubmitting.value = true;

    // Simulate API call - override this with actual API call
    setTimeout(() => {
      comments.value.unshift({
        id: String(Date.now()),
        role: 'user',
        parts: [{ type: 'text', id: `${Date.now()}-1`, text: newComment.value }],
        avatar: { icon: 'i-lucide-user', alt: 'You' },
        author: 'You',
        date: 'Just now',
      } as BlogComment);

      newComment.value = '';
      isSubmitting.value = false;
    }, 500);
  }

  return {
    comments,
    newComment,
    isSubmitting,
    submitComment,
  };
}
