import { ref, computed } from 'vue';
import zxcvbn from 'zxcvbn';

export function usePasswordValidation() {
  const password = ref('');
  const score = ref(0);
  const feedback = ref<{
    suggestions: string[];
    warning: string | null;
  }>({
    suggestions: [],
    warning: null,
  });

  function validatePassword(value: string) {
    password.value = value;

    if (!value || value.length < 8) {
      score.value = 0;
      feedback.value = {
        suggestions: [],
        warning: 'Password must be at least 8 characters',
      };
      return;
    }

    const result = zxcvbn(value);
    score.value = result.score;
    feedback.value = {
      suggestions: result.feedback.suggestions || [],
      warning: result.feedback.warning || null,
    };
  }

  const isValid = computed(() => {
    return password.value.length >= 8 && score.value >= 2;
  });

  const strengthLabel = computed(() => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[score.value] || 'Unknown';
  });

  const strengthColor = computed(() => {
    const colors = ['red', 'orange', 'yellow', 'blue', 'green'];
    return colors[score.value] || 'gray';
  });

  return {
    password,
    score,
    feedback,
    isValid,
    strengthLabel,
    strengthColor,
    validatePassword,
  };
}
