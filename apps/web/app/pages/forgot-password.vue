<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
});

useSeoMeta({
  title: 'Forgot Password',
  description: 'Reset your password',
});

const toast = useToast();
const router = useRouter();
const { isAuthenticated, requestPasswordReset } = useAuth();

// Redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/');
  }
});

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email address',
    required: true,
  },
];

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type Schema = z.output<typeof schema>;

const submitting = ref(false);
const success = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  submitting.value = true;

  try {
    const result = await requestPasswordReset(payload.data.email);

    if (!result.success) {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to send password reset code',
        color: 'error',
      });
      return;
    }

    success.value = true;
    toast.add({
      title: 'Code Sent',
      description: 'A password reset code has been sent to your email',
      color: 'primary',
    });

    // Redirect to reset password page after a short delay
    setTimeout(() => {
      router.push({
        path: '/reset-password',
        query: { email: payload.data.email },
      });
    }, 2000);
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to send password reset code',
      color: 'error',
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Forgot Password"
    icon="i-lucide-lock"
    :submit="{ label: submitting ? 'Sending...' : 'Send Reset Code' }"
    :disabled="submitting || success"
    @submit.prevent="onSubmit"
  >
    <template #description>
      Enter your email address and we'll send you a code to reset your password.
    </template>

    <template v-if="success" #after-fields>
      <div class="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
        <p class="text-sm text-green-800 dark:text-green-200">
          Password reset code sent! Redirecting to reset page...
        </p>
      </div>
    </template>

    <template #footer>
      <div class="text-center">
        <ULink to="/login" class="text-sm text-primary hover:underline"> Back to login </ULink>
      </div>
    </template>
  </UAuthForm>
</template>
