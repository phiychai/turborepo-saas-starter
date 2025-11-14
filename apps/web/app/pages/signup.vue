<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import UsernameChecker from '~/components/auth/UsernameChecker.vue';
import PasswordStrengthMeter from '~/components/PasswordStrengthMeter.vue';
import { usePasswordValidation } from '~/composables/usePasswordValidation';
import { authClient } from '~/lib/auth-client';

definePageMeta({
  layout: 'auth',
});

useSeoMeta({
  title: 'Sign up',
  description: 'Create an account to get started',
});

const toast = useToast();
const router = useRouter();
const { register, isAuthenticated } = useAuth();

// Redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/');
  }
});

const username = ref('');
const passwordValue = ref('');
const { score, feedback, validatePassword } = usePasswordValidation();

// Watch password changes for real-time validation
watch(passwordValue, (value) => {
  validatePassword(value);
});

const fields = [
  {
    name: 'name',
    type: 'text' as const,
    label: 'Name',
    placeholder: 'Enter your name',
  },
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Enter your password',
  },
];

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => {
      toast.add({ title: 'Google', description: 'Sign up with Google - Coming soon' });
    },
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => {
      toast.add({ title: 'GitHub', description: 'Sign up with GitHub - Coming soon' });
    },
  },
];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  // Validate password strength before submitting
  validatePassword(payload.data.password);
  passwordValue.value = payload.data.password;

  const result = await register({
    email: payload.data.email,
    password: payload.data.password,
    fullName: payload.data.name,
    username: username.value.trim() || undefined,
  });

  if (result.success) {
    // Better Auth automatically sends verification OTP when sendOnSignUp: true
    // No need to manually send it here
    toast.add({
      title: 'Account Created',
      description: 'Please check your email for a verification code',
      color: 'blue',
    });

    // Redirect to verification page
    router.push({
      path: '/verify-email',
      query: { email: payload.data.email },
    });
  } else {
    // Handle Better Auth errors
    let errorMessage = result.error || 'Registration failed';

    // Check for password-related errors
    if (result.error?.includes('PASSWORD_COMPROMISED') || result.error?.includes('data breach')) {
      errorMessage =
        'This password has been exposed in a data breach. Please choose a different password.';
    } else if (result.error?.includes('too weak') || result.error?.includes('strength')) {
      errorMessage = result.error || 'Password is too weak. Please use a stronger password.';
    }

    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    });
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :providers="providers"
    title="Create an account"
    :submit="{ label: 'Create account' }"
    @submit.prevent="onSubmit"
    @update:password="passwordValue = $event"
  >
    <template #description>
      Already have an account? <ULink to="/login" class="text-primary font-medium">Login</ULink>.
    </template>

    <!-- Password strength meter (shown after password field) -->
    <template #password-hint>
      <div v-if="passwordValue" class="mt-2">
        <PasswordStrengthMeter :password="passwordValue" :score="score" :feedback="feedback" />
      </div>
    </template>

    <!-- Username field (optional) -->
    <template #after-fields>
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Username <span class="text-gray-500 text-xs">(optional)</span>
        </label>
        <UsernameChecker v-model="username" placeholder="Choose a username" />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Lowercase letters, numbers, and underscores only. 3-30 characters.
        </p>
      </div>
    </template>

    <template #footer>
      By signing up, you agree to our
      <ULink to="/" class="text-primary font-medium">Terms of Service</ULink>.
    </template>
  </UAuthForm>
</template>
