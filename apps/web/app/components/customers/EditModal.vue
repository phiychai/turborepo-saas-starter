<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { DashboardUser } from '~/types';

const props = defineProps<{
  user: DashboardUser | null;
}>();

const emit = defineEmits<{
  updated: [user: DashboardUser];
}>();

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['user', 'admin']),
  isActive: z.boolean(),
});

const open = ref(false);
const loading = ref(false);
const toast = useToast();

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  firstName: undefined,
  lastName: undefined,
  role: 'user',
  isActive: true,
});

// Watch for user prop changes to populate form
watch(
  () => props.user,
  (user) => {
    if (user) {
      // Parse name into first and last name
      const nameParts = user.name.split(' ');
      state.firstName = nameParts[0] || '';
      state.lastName = nameParts.slice(1).join(' ') || '';
      state.role = (user as any).role || 'user';
      state.isActive = (user as any).isActive !== false;
      open.value = true;
    }
  }
);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.user) return;

  loading.value = true;
  try {
    const response = await $fetch(`/api/admin/users/${props.user.id}`, {
      method: 'PATCH',
      body: {
        firstName: event.data.firstName,
        lastName: event.data.lastName,
        role: event.data.role,
        isActive: event.data.isActive,
      },
      credentials: 'include',
    });

    toast.add({
      title: 'Success',
      description: 'User updated successfully',
      color: 'success',
    });

    // Emit updated user data
    const updatedUser = {
      ...props.user,
      name: `${event.data.firstName} ${event.data.lastName}`,
      status: event.data.isActive ? 'subscribed' : ('unsubscribed' as const),
      ...response.user,
    };

    emit('updated', updatedUser);
    open.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to update user',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function reset() {
  state.firstName = undefined;
  state.lastName = undefined;
  state.role = 'user';
  state.isActive = true;
}

watch(open, (isOpen) => {
  if (!isOpen) {
    reset();
  }
});
</script>

<template>
  <UModal v-model:open="open" title="Edit Customer" description="Update customer information">
    <template #body>
      <UForm v-if="user" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="First Name" name="firstName">
          <UInput v-model="state.firstName" class="w-full" />
        </UFormField>

        <UFormField label="Last Name" name="lastName">
          <UInput v-model="state.lastName" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput :model-value="user?.email" disabled class="w-full" />
          <template #description>
            <span class="text-sm text-muted">Email cannot be changed</span>
          </template>
        </UFormField>

        <UFormField label="Role" name="role">
          <USelect
            v-model="state.role"
            :options="[
              { label: 'User', value: 'user' },
              { label: 'Admin', value: 'admin' },
            ]"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Status" name="isActive">
          <UToggle v-model="state.isActive" />
          <template #description>
            <span class="text-sm text-muted">
              {{ state.isActive ? 'Active' : 'Inactive' }}
            </span>
          </template>
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
            label="Update"
            color="primary"
            variant="solid"
            type="submit"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
