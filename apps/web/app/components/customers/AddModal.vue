<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const emit = defineEmits<{
  created: [];
}>();

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin', 'content_admin', 'editor', 'writer']),
});

const open = ref(false);
const loading = ref(false);
const toast = useToast();

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  password: undefined,
  role: 'user',
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    await $fetch<{ user?: Record<string, unknown> }>('/api/admin/users', {
      method: 'POST' as const,
      body: {
        firstName: event.data.firstName,
        lastName: event.data.lastName,
        email: event.data.email,
        password: event.data.password,
        role: event.data.role,
      },
      credentials: 'include',
    });

    toast.add({
      title: 'Success',
      description: `User ${event.data.firstName} ${event.data.lastName} created successfully`,
      color: 'success',
    });

    // Reset form
    state.firstName = undefined;
    state.lastName = undefined;
    state.email = undefined;
    state.password = undefined;
    state.role = 'user';

    // Emit event to refresh table
    emit('created');
    open.value = false;
  } catch (error: unknown) {
    const errorData =
      error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { message?: string } }).data
        : undefined;
    const errorMessage = error instanceof Error ? error.message : undefined;
    toast.add({
      title: 'Error',
      description: errorData?.message || errorMessage || 'Failed to create user',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function reset() {
  state.firstName = undefined;
  state.lastName = undefined;
  state.email = undefined;
  state.password = undefined;
  state.role = 'user';
}

watch(open, (isOpen) => {
  if (!isOpen) {
    reset();
  }
});
</script>

<template>
  <div>
    <UButton label="Add User" icon="i-lucide-plus" color="primary" @click="open = true" />

    <UModal v-model:open="open" title="Add New User" description="Create a new user account">
      <template #body>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="First Name" name="firstName">
            <UInput v-model="state.firstName" placeholder="John" class="w-full" />
          </UFormField>

          <UFormField label="Last Name" name="lastName">
            <UInput v-model="state.lastName" placeholder="Doe" class="w-full" />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="john.doe@example.com"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Minimum 8 characters"
              class="w-full"
            />
            <template #description>
              <span class="text-sm text-muted">Password must be at least 8 characters</span>
            </template>
          </UFormField>

          <UFormField label="Role" name="role">
            <USelect
              v-model="state.role"
              :options="[
                { label: 'User', value: 'user' },
                { label: 'Admin', value: 'admin' },
                { label: 'Content Admin', value: 'content_admin' },
                { label: 'Editor', value: 'editor' },
                { label: 'Writer', value: 'writer' },
              ]"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton
              label="Cancel"
              color="neutral"
              variant="subtle"
              :disabled="loading"
              @click="open = false"
            />
            <UButton
              label="Create User"
              color="primary"
              variant="solid"
              type="submit"
              :loading="loading"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
