import { ref, watch } from 'vue';

export interface OtpVerificationOptions {
  /** Cooldown duration in seconds (default: 60) */
  cooldownSeconds?: number;
}

export interface UseOtpVerificationReturn {
  otp: Ref<string>;
  verifying: Ref<boolean>;
  error: Ref<string>;
  resending: Ref<boolean>;
  resendCooldown: Ref<number>;
  handleVerify: () => Promise<void>;
  resendOTP: () => Promise<void>;
}

export function useOtpVerification(
  verifyFn: (otp: string) => Promise<{ error?: { message: string } }>,
  resendFn: () => Promise<{ error?: { message: string } }>,
  options: OtpVerificationOptions = {}
): UseOtpVerificationReturn {
  const { cooldownSeconds = 60 } = options;

  const otp = ref('');
  const verifying = ref(false);
  const error = ref('');
  const resending = ref(false);
  const resendCooldown = ref(0);

  let cooldownInterval: ReturnType<typeof setInterval> | null = null;

  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    watch(
      () => resendCooldown.value,
      (value) => {
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
      },
      { immediate: true }
    );

    // Cleanup on unmount (this would need to be called by the component)
    const cleanup = () => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    };

    // Expose cleanup via onUnmounted in the component
    if (typeof window !== 'undefined') {
      (window as any).__otpCleanup = cleanup;
    }
  }

  async function handleVerify() {
    if (!otp.value || otp.value.length !== 6) {
      error.value = 'Please enter a valid 6-digit code';
      return;
    }

    verifying.value = true;
    error.value = '';

    try {
      const result = await verifyFn(otp.value);

      if (result.error) {
        error.value = result.error.message || 'Verification failed';
        return;
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Verification failed';
    } finally {
      verifying.value = false;
    }
  }

  async function resendOTP() {
    if (resendCooldown.value > 0) return;

    resending.value = true;
    error.value = '';

    try {
      const result = await resendFn();

      if (result.error) {
        error.value = result.error.message || 'Failed to resend code';
        return;
      }

      // Set cooldown
      resendCooldown.value = cooldownSeconds;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to resend code';
    } finally {
      resending.value = false;
    }
  }

  return {
    otp,
    verifying,
    error,
    resending,
    resendCooldown,
    handleVerify,
    resendOTP,
  };
}
