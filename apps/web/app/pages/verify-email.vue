<script setup lang="ts">
import { authClient } from '~/lib/auth-client';
import { useAuthStore } from '~/stores/auth';

definePageMeta({
  layout: 'auth',
});

useSeoMeta({
  title: 'Verify Email',
  description: 'Verify your email address to complete registration',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const email = (route.query.email as string) || '';
const otp = ref('');
const verifying = ref(false);
const error = ref('');
const resending = ref(false);
const resendCooldown = ref(0);

// Resend cooldown timer
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

watch(resendCooldown, (value) => {
  if (value > 0 && !cooldownInterval) {
    cooldownInterval = setInterval(() => {
      resendCooldown.value--;
      if (resendCooldown.value <= 0) {
        if (cooldownInterval) {
          clearInterval(cooldownInterval);
          cooldownInterval = null;
        }
      }
    }, 1000);
  }
});

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
});

async function handleVerify() {
  if (!otp.value || otp.value.length !== 6) {
    error.value = 'Please enter a valid 6-digit code';
    return;
  }

  if (!email) {
    error.value = 'Email address is required';
    return;
  }

  verifying.value = true;
  error.value = '';

  try {
    // Use verifyEmail method for email verification with OTP
    // According to Better Auth docs: /email-otp/verify-email endpoint
    const result = await authClient.emailOtp.verifyEmail({
      email,
      otp: otp.value,
    });

    if (result.error) {
      error.value = result.error.message || 'Verification failed';
      return;
    }

    toast.add({
      title: 'Success',
      description: 'Email verified successfully!',
      color: 'primary',
    });

    // Better Auth may auto-sign in after verification (if autoSignInAfterVerification is enabled)
    // Check if user is now logged in by fetching session
    try {
      // Wait a moment for session cookie to be set
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Fetch user data to check if session exists
      const fetchResult = await authStore.fetchUser();

      // If user is authenticated, redirect to dashboard
      if (fetchResult.success && authStore.isAuthenticated) {
        router.push('/');
        return;
      }
    } catch (fetchError) {
      // If fetch fails, continue to login redirect
      console.log('Session check failed, redirecting to login:', fetchError);
    }

    // If not auto-signed in, redirect to login with success message
    // This shouldn't happen if autoSignInAfterVerification is enabled
    router.push({
      path: '/login',
      query: { verified: 'true' },
    });
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Verification failed. Please try again.';
  } finally {
    verifying.value = false;
  }
}

async function resendOTP() {
  if (resendCooldown.value > 0) return;

  if (!email) {
    error.value = 'Email address is required';
    return;
  }

  resending.value = true;
  error.value = '';

  try {
    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    });

    if (result.error) {
      error.value = result.error.message || 'Failed to resend code';
      return;
    }

    // Set cooldown (60 seconds)
    resendCooldown.value = 60;

    toast.add({
      title: 'Code Sent',
      description: 'A new verification code has been sent to your email',
      color: 'primary',
    });
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to resend code';
  } finally {
    resending.value = false;
  }
}

// Auto-focus OTP input (using autofocus attribute on UInput)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="text-center text-3xl font-bold tracking-tight">Verify Your Email</h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          We've sent a verification code to
          <span class="font-medium">{{ email || 'your email' }}</span>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleVerify">
        <div>
          <label for="otp" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Enter verification code
          </label>
          <div class="mt-1">
            <UInput
              id="otp"
              v-model="otp"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              placeholder="000000"
              class="text-center text-2xl font-mono tracking-widest"
              :disabled="verifying"
              autofocus
              required
            />
          </div>
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <div>
          <UButton type="submit" :disabled="verifying || !otp || otp.length !== 6" block>
            {{ verifying ? 'Verifying...' : 'Verify Email' }}
          </UButton>
        </div>
      </form>

      <div class="text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">Didn't receive the code?</p>
        <UButton
          variant="ghost"
          size="sm"
          :disabled="resending || resendCooldown > 0"
          class="mt-2"
          @click="resendOTP"
        >
          {{
            resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : resending
                ? 'Sending...'
                : 'Resend Code'
          }}
        </UButton>
      </div>

      <div class="text-center">
        <ULink to="/login" class="text-sm text-primary hover:underline"> Back to login </ULink>
      </div>
    </div>
  </div>
</template>
