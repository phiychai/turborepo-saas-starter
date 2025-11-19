<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { upperFirst } from 'scule';
import { getPaginationRowModel } from '@tanstack/table-core';
import type { Row } from '@tanstack/table-core';
import type { DashboardUser } from '~/types';

definePageMeta({
  layout: 'dashboard',
  middleware: 'admin',
});

const UAvatar = resolveComponent('UAvatar');
const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UCheckbox = resolveComponent('UCheckbox');

const toast = useToast();
const table = useTemplateRef('table');

const columnFilters = ref([
  {
    id: 'email',
    value: '',
  },
]);
const columnVisibility = ref();
const rowSelection = ref({});

// Pagination state
const pagination = ref({
  pageIndex: 0,
  pageSize: 25,
});

// Fetch users from admin API
const {
  data: usersData,
  status,
  refresh,
} = await useFetch<{ users?: { data?: unknown[]; pagination?: { page?: number; perPage?: number; total?: number } } | unknown[]; data?: unknown[]; pagination?: { page?: number; perPage?: number; total?: number } }>('/api/admin/users', {
  lazy: true,
  query: {
    page: computed(() => pagination.value.pageIndex + 1),
    limit: computed(() => pagination.value.pageSize),
    search: computed(() => columnFilters.value.find((f) => f.id === 'email')?.value || ''),
  },
});

// Pagination helpers
const getPaginationTotal = computed(() => {
  const data = usersData.value;
  if (data && typeof data === 'object') {
    if ('pagination' in data && data.pagination && typeof data.pagination === 'object' && 'total' in data.pagination) {
      return (data.pagination as { total?: number }).total ?? 0;
    }
    if ('users' in data && data.users && typeof data.users === 'object' && 'pagination' in data.users) {
      const users = data.users as { pagination?: { total?: number } };
      return users.pagination?.total ?? 0;
    }
  }
  if (!data) return 0;
  return (Array.isArray(data) ? data.length : 0);
});

const getPaginationPage = computed(() => {
  const data = usersData.value;
  if (data && typeof data === 'object') {
    if ('pagination' in data && data.pagination && typeof data.pagination === 'object' && 'page' in data.pagination) {
      return (data.pagination as { page?: number }).page ?? pagination.value.pageIndex + 1;
    }
    if ('users' in data && data.users && typeof data.users === 'object' && 'pagination' in data.users) {
      const users = data.users as { pagination?: { page?: number } };
      return users.pagination?.page ?? pagination.value.pageIndex + 1;
    }
  }
  return pagination.value.pageIndex + 1;
});

const getPaginationPerPage = computed(() => {
  const data = usersData.value;
  if (data && typeof data === 'object') {
    if ('pagination' in data && data.pagination && typeof data.pagination === 'object' && 'perPage' in data.pagination) {
      return (data.pagination as { perPage?: number }).perPage ?? pagination.value.pageSize;
    }
    if ('users' in data && data.users && typeof data.users === 'object' && 'pagination' in data.users) {
      const users = data.users as { pagination?: { perPage?: number } };
      return users.pagination?.perPage ?? pagination.value.pageSize;
    }
  }
  return pagination.value.pageSize;
});

// Map backend users to DashboardUser format
const data = computed<DashboardUser[]>(() => {
  if (!usersData.value) return [];

  // Handle different response structures
  // AdonisJS pagination might return users.data or users directly
  type BackendUser = {
    id: number | string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    isActive?: boolean;
    role?: 'user' | 'admin';
  };

  let usersArray: BackendUser[] = [];

  if (usersData.value?.users && Array.isArray(usersData.value.users)) {
    usersArray = usersData.value.users as BackendUser[];
  } else if (usersData.value?.users && typeof usersData.value.users === 'object' && 'data' in usersData.value.users && Array.isArray(usersData.value.users.data)) {
    usersArray = usersData.value.users.data as BackendUser[];
  } else if (usersData.value?.data && Array.isArray(usersData.value.data)) {
    usersArray = usersData.value.data as BackendUser[];
  }

  if (!Array.isArray(usersArray) || usersArray.length === 0) {
    return [];
  }

  return usersArray.map((user: BackendUser) => {
    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      user.email?.split('@')[0] ||
      'User';

    return {
      id: user.id,
      name: fullName,
      email: user.email || '',
      avatar: {
        src: user.avatarUrl || `https://i.pravatar.cc/128?u=${user.id}`,
        alt: fullName,
      },
      status: user.isActive ? 'subscribed' : 'unsubscribed',
      location: '—', // Not available in user model
      role: user.role || 'user',
      isActive: user.isActive !== false,
    } as DashboardUser & { role: string; isActive: boolean };
  });
});

// Selected user for editing
const selectedUser = ref<DashboardUser | null>(null);

// Sync state
const syncing = ref(false);

async function syncAllUsers() {
  syncing.value = true;
  try {
    const response = await $fetch('/api/admin/users/sync-all', {
      method: 'POST',
      credentials: 'include',
    });

    const responseData = response as { synced?: number; skipped?: number; failed?: number };
    toast.add({
      title: 'Sync Complete',
      description: `Synced ${responseData.synced || 0} users, ${responseData.skipped || 0} already existed, ${responseData.failed || 0} failed`,
      color: 'success',
    });

    // Refresh the table
    await refresh();
  } catch (error: unknown) {
    const errorData = error && typeof error === 'object' && 'data' in error ? (error as { data?: { message?: string } }).data : undefined;
    toast.add({
      title: 'Sync Failed',
      description: errorData?.message || 'Failed to sync users',
      color: 'error',
    });
  } finally {
    syncing.value = false;
  }
}

function getRowItems(row: Row<DashboardUser>) {
  return [
    {
      type: 'label',
      label: 'Actions',
    },
    {
      label: 'Edit customer',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedUser.value = row.original;
      },
    },
    {
      label: 'Copy customer ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString());
        toast.add({
          title: 'Copied to clipboard',
          description: 'Customer ID copied to clipboard',
        });
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Delete customer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        handleDelete(row.original.id);
      },
    },
  ];
}

async function handleDelete(userId: number) {
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    toast.add({
      title: 'Success',
      description: 'Customer deleted successfully',
      color: 'success',
    });

    await refresh();
  } catch (error: unknown) {
    const errorData = error && typeof error === 'object' && 'data' in error ? (error as { data?: { message?: string } }).data : undefined;
    toast.add({
      title: 'Error',
      description: errorData?.message || 'Failed to delete customer',
      color: 'error',
    });
  }
}

function handleUserUpdated(updatedUser: DashboardUser) {
  // Refresh the data after update
  refresh();
  selectedUser.value = null;
}

const columns: TableColumn<DashboardUser>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all',
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        ariaLabel: 'Select row',
      }),
  },
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          ...row.original.avatar,
          size: 'lg',
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-muted text-sm' }, row.original.email),
        ]),
      ]),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Email',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      });
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = ('role' in row.original && typeof row.original.role === 'string' ? row.original.role : 'user') as 'user' | 'admin';
      const color = role === 'admin' ? 'primary' : 'neutral';

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => role);
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const statusColors: Record<DashboardUser['status'], 'success' | 'error' | 'warning'> = {
        subscribed: 'success',
        unsubscribed: 'error',
        bounced: 'warning',
      };

      const color = statusColors[row.original.status] || 'error';

      return h(
        UBadge,
        { class: 'capitalize', variant: 'subtle', color },
        () => row.original.status
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end',
            },
            items: getRowItems(row),
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto',
            })
        )
      ),
  },
];

const statusFilter = ref('all');

watch(
  () => statusFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return;

    const statusColumn = table.value.tableApi.getColumn('status');
    if (!statusColumn) return;

    if (newVal === 'all') {
      statusColumn.setFilterValue(undefined);
    } else {
      statusColumn.setFilterValue(newVal);
    }
  }
);
</script>

<template>
  <CustomersEditModal :user="selectedUser" @updated="handleUserUpdated" />

  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Customers">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Sync All Users"
            color="primary"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="syncing"
            @click="syncAllUsers"
          />
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter emails..."
          @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <CustomersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </CustomersDeleteModal>

          <USelect
            v-model="statusFilter"
            :options="[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'subscribed' },
              { label: 'Inactive', value: 'unsubscribed' },
            ]"
            :ui="{
              trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
            placeholder="Filter status"
            class="min-w-28"
          />
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: { getCanHide?: () => boolean }) => column.getCanHide?.())
                .map((column: { id: string; getIsVisible?: () => boolean }) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible?.() ?? true,
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked);
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault();
                  },
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0',
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ getPaginationTotal }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="getPaginationPage"
            :items-per-page="getPaginationPerPage"
            :total="getPaginationTotal"
            @update:page="
              (p: number) => {
                pagination.pageIndex = p - 1;
                refresh();
              }
            "
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
