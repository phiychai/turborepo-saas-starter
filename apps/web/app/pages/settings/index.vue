<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const authStore = useAuthStore();
const toast = useToast();
const fileRef = ref<HTMLInputElement>();
const uploadingAvatar = ref(false);
const saving = ref(false);

const profileSchema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.string().email('Invalid email'),
  username: z.string().min(2, 'Too short'),
  avatar: z.string().optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Initialize profile from user data
const profile = reactive<Partial<ProfileSchema>>({
  name: '',
  email: '',
  username: '',
  avatar: undefined,
  bio: undefined,
});

// Load user data on mount
onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser();
  }

  if (authStore.user) {
    // Combine firstName and lastName into name
    const nameParts = [authStore.user.firstName, authStore.user.lastName].filter(Boolean);
    profile.name = nameParts.length > 0 ? nameParts.join(' ') : authStore.user.fullName || '';
    profile.email = authStore.user.email;
    profile.username = authStore.user.username || '';
    profile.avatar = authStore.user.avatarUrl || undefined;
    profile.bio = authStore.user.bio || undefined;
  }
});

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  if (!authStore.user) {
    toast.add({
      title: 'Error',
      description: 'You must be logged in to update your profile.',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
    return;
  }

  saving.value = true;

  try {
    const data = event.data;
    const originalUsername = authStore.user?.username || '';

    // Handle username update separately via Better Auth for immediate validation
    let updatedUsername: string | undefined = undefined;
    if (data.username !== originalUsername && data.username) {
      const usernameResult = await authStore.updateUsername(data.username);
      if (!usernameResult.success) {
        toast.add({
          title: 'Username update failed',
          description: usernameResult.error || 'Invalid username. Please check the requirements.',
          icon: 'i-lucide-alert-circle',
          color: 'error',
        });
        saving.value = false;
        return; // Stop here if username validation failed
      }
      // Include username in updateData so AdonisJS gets synced
      updatedUsername = data.username;
    }

    // Prepare update data - include username if it was updated
    const updateData: any = {
      name: data.name, // Will be split on backend
      email: data.email,
      bio: data.bio || null,
    };

    // Include username if it was updated (so AdonisJS gets synced)
    if (updatedUsername !== undefined) {
      updateData.username = updatedUsername;
    }

    // Update avatar URL if it was changed (uploaded)
    if (data.avatar && data.avatar.startsWith('/uploads/')) {
      updateData.avatarUrl = data.avatar;
    }

    // Call updateProfile which handles name splitting and email sync
    const result = await authStore.updateProfile(updateData);

    if (result.success) {
      // Refresh user data to get latest from server
      await authStore.fetchUser();

      toast.add({
        title: 'Success',
        description: 'Your settings have been updated.',
        icon: 'i-lucide-check',
        color: 'success',
      });
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to update profile.',
        icon: 'i-lucide-alert-circle',
        color: 'error',
      });
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update profile.',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;

  if (!input.files?.length) {
    return;
  }

  const file = input.files[0]!;

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    toast.add({
      title: 'Invalid file type',
      description: 'Please select a JPG, PNG, or GIF image.',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
    return;
  }

  // Validate file size (1MB max)
  if (file.size > 1024 * 1024) {
    toast.add({
      title: 'File too large',
      description: 'Avatar must be 1MB or smaller.',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
    return;
  }

  uploadingAvatar.value = true;

  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('avatar', file);

    // Upload to backend
    const requestFetch = useRequestFetch();
    const response = await requestFetch<{ avatarUrl: string }>('/api/user/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (response.avatarUrl) {
      profile.avatar = response.avatarUrl;
      // Refresh user data to get updated avatar
      await authStore.fetchUser();
      toast.add({
        title: 'Success',
        description: 'Avatar uploaded successfully.',
        icon: 'i-lucide-check',
        color: 'success',
      });
    }
  } catch (error: any) {
    toast.add({
      title: 'Upload failed',
      description: error.message || 'Failed to upload avatar.',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
  } finally {
    uploadingAvatar.value = false;
    // Reset file input
    if (input) {
      input.value = '';
    }
  }
}

function onFileClick() {
  fileRef.value?.click();
}
</script>

<template>
  <UForm id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
    <UPageCard
      title="Profile"
      description="These informations will be displayed publicly."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Save changes"
        color="neutral"
        type="submit"
        :loading="saving"
        :disabled="saving || uploadingAvatar"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Will appear on receipts, invoices, and other communication."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.name" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="email"
        label="Email"
        description="Used to sign in, for email receipts and product updates."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.email" type="email" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="username"
        label="Username"
        description="Your unique username for logging in and your profile URL."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.username" type="username" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="avatar"
        label="Avatar"
        description="JPG, GIF or PNG. 1MB Max."
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <UAvatar :src="profile.avatar" :alt="profile.name" size="lg" />
          <UButton
            label="Choose"
            color="neutral"
            :loading="uploadingAvatar"
            :disabled="uploadingAvatar || saving"
            @click="onFileClick"
          />
          <input
            ref="fileRef"
            type="file"
            class="hidden"
            accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
            @change="onFileChange"
          />
        </div>
      </UFormField>
      <USeparator />
      <UFormField
        name="bio"
        label="Bio"
        description="Brief description for your profile. URLs are hyperlinked."
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea v-model="profile.bio" :rows="5" autoresize class="w-full" />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
