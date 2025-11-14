<template>
  <div class="username-checker">
    <div class="relative">
      <UInput
        :model-value="modelValue"
        @update:model-value="handleInput"
        :class="['input', statusClass]"
        :placeholder="placeholder"
      />

      <!-- Loading indicator -->
      <div v-if="checking" class="absolute right-3 top-3">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>

      <!-- Status icon -->
      <div v-else-if="checked" class="absolute right-3 top-3">
        <svg
          v-if="available && valid"
          class="w-5 h-5 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <svg v-else class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <!-- Status message -->
    <div v-if="checked" class="mt-1 text-sm" :class="statusTextClass">
      <span v-if="available && valid">✓ Username is available</span>
      <span v-else-if="!valid">{{ errorMessage }}</span>
      <span v-else>✗ Username is not available</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from '~/lib/auth-client';

interface Props {
  modelValue: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Choose a username',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const checking = ref(false);
const checked = ref(false);
const available = ref(false);
const valid = ref(false);
const errorMessage = ref('');

let debounceTimer: NodeJS.Timeout | null = null;

const statusClass = computed(() => {
  if (!checked.value) return '';
  if (available.value && valid.value) return 'border-green-500';
  return 'border-red-500';
});

const statusTextClass = computed(() => {
  if (available.value && valid.value) return 'text-green-600';
  return 'text-red-600';
});

async function checkUsername(username: string) {
  if (!username || username.length < 3) {
    checked.value = false;
    return;
  }

  checking.value = true;
  checked.value = false;

  try {
    // Use Better Auth's username availability check
    // According to Better Auth docs: authClient.isUsernameAvailable({ username })
    const result = await authClient.isUsernameAvailable({ username });

    if (result.error) {
      available.value = false;
      valid.value = false;
      errorMessage.value = result.error.message || 'Username is not available';
      checked.value = true;
      return;
    }

    // result.data contains { available: boolean }
    available.value = result.data?.available || false;
    valid.value = true; // Better Auth handles validation
    checked.value = true;
  } catch (error: any) {
    // Better Auth will return validation errors
    available.value = false;
    valid.value = false;
    errorMessage.value = error.message || 'Username is not available';
    checked.value = true;
  } finally {
    checking.value = false;
  }
}

function handleInput(value: string) {
  emit('update:modelValue', value);

  // Reset state
  checked.value = false;
  available.value = false;
  valid.value = false;
  errorMessage.value = '';

  // Debounce username check
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    checkUsername(value);
  }, 500);
}
</script>
