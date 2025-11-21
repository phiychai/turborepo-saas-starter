<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import PasswordStrengthMeter from '~/components/PasswordStrengthMeter.vue';
import { usePasswordValidation } from '~/composables/usePasswordValidation';

definePageMeta({
  layout: 'auth',
});

useSeoMeta({
  title: 'Reset Password',
  description: 'Reset your password with the code sent to your email',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { isAuthenticated, resetPassword } = useAuth();

// Redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/');
  }
});

const email = (route.query.email as string) || '';
const otp = ref('');
const passwordValue = ref('');
const confirmPassword = ref('');
const { score, feedback, validatePassword } = usePasswordValidation();

// Watch password changes for real-time validation
watch(passwordValue, (value) => {
  validatePassword(value);
});

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    name: 'otp',
    type: 'text' as const,
    label: 'Verification Code',
    placeholder: 'Enter 6-digit code',
    required: true,
  },
  {
    name: 'password',
    label: 'New Password',
    type: 'password' as const,
    placeholder: 'Enter your new password',
    required: true,
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password' as const,
    placeholder: 'Confirm your new password',
    required: true,
  },
];

const schema = z
  .object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'Code must be 6 digits'),
    password: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Schema = z.output<typeof schema>;

const resetting = ref(false);
const error = ref('');

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  // Validate password strength before submitting
  validatePassword(payload.data.password);
  passwordValue.value = payload.data.password;

  if (payload.data.password !== payload.data.confirmPassword) {
    error.value = "Passwords don't match";
    return;
  }

  resetting.value = true;
  error.value = '';

  try {
    const result = await resetPassword(payload.data.email, payload.data.otp, payload.data.password);

    if (!result.success) {
      error.value = result.error || 'Password reset failed';
      toast.add({
        title: 'Error',
        description: result.error || 'Password reset failed',
        color: 'error',
      });
      return;
    }

    toast.add({
      title: 'Success',
      description: 'Your password has been reset successfully',
      color: 'success',
    });

    // Redirect to login page
    router.push('/login');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
    error.value = errorMessage;
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    });
  } finally {
    resetting.value = false;
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Reset Password"
    icon="i-lucide-lock"
    :submit="{ label: resetting ? 'Resetting...' : 'Reset Password' }"
    :disabled="resetting"
    @submit.prevent="onSubmit"
    @update:password="passwordValue = $event"
  >
    <template #description> Enter the code sent to your email and choose a new password. </template>

    <!-- Password strength meter (shown after password field) -->
    <template #password-hint>
      <div v-if="passwordValue" class="mt-2">
        <PasswordStrengthMeter :password="passwordValue" :score="score" :feedback="feedback" />
      </div>
    </template>

    <!-- Pre-fill email if provided in query -->
    <template #after-fields>
      <div v-if="email" class="text-sm text-gray-600 dark:text-gray-400">
        <p>
          Code sent to: <span class="font-medium">{{ email }}</span>
        </p>
      </div>

      <div v-if="error" class="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>
    </template>

    <template #footer>
      <div class="text-center">
        <ULink to="/login" class="text-sm text-primary hover:underline"> Back to login </ULink>
      </div>
    </template>
  </UAuthForm>
</template>
