<script setup lang="ts">
const authStore = useAuthStore();

// Protect admin route - only admin users can access
definePageMeta({
  layout: 'dashboard',
  middleware: 'admin',
});

// Admin stats (placeholder data)
const stats = ref({
  totalUsers: 0,
  activeSubscriptions: 0,
  monthlyRevenue: 0,
  supportTickets: 0,
});

// Fetch admin data
onMounted(async () => {
  // TODO: Replace with actual API calls
  stats.value = {
    totalUsers: 1247,
    activeSubscriptions: 856,
    monthlyRevenue: 45230,
    supportTickets: 23,
  };
});
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Admin Dashboard">
        <template #right>
          <UButton label="Back to Site" to="/" variant="ghost" icon="i-heroicons-arrow-left" />
        </template>
      </UDashboardNavbar>

      <UDashboardPanelContent>
        <div class="space-y-6">
          <!-- Welcome Section -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold">Admin Dashboard</h1>
              <p class="text-gray-600 dark:text-gray-400 mt-2">
                System overview and administration
              </p>
            </div>
            <UBadge color="error" variant="subtle">
              <Icon name="lucide:shield-check" class="mr-1" />
              Admin
            </UBadge>
          </div>

          <!-- Admin Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Icon name="lucide:users" class="w-5 h-5" />
                  <span class="text-sm">Total Users</span>
                </div>
                <p class="text-3xl font-bold">{{ stats.totalUsers.toLocaleString() }}</p>
                <p class="text-xs text-green-600 dark:text-green-400">
                  <Icon name="lucide:trending-up" class="w-3 h-3 inline" />
                  +12% from last month
                </p>
              </div>
            </UCard>

            <UCard>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Icon name="lucide:credit-card" class="w-5 h-5" />
                  <span class="text-sm">Active Subscriptions</span>
                </div>
                <p class="text-3xl font-bold">{{ stats.activeSubscriptions.toLocaleString() }}</p>
                <p class="text-xs text-green-600 dark:text-green-400">
                  <Icon name="lucide:trending-up" class="w-3 h-3 inline" />
                  +8% from last month
                </p>
              </div>
            </UCard>

            <UCard>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Icon name="lucide:dollar-sign" class="w-5 h-5" />
                  <span class="text-sm">Monthly Revenue</span>
                </div>
                <p class="text-3xl font-bold">${{ (stats.monthlyRevenue / 1000).toFixed(1) }}k</p>
                <p class="text-xs text-green-600 dark:text-green-400">
                  <Icon name="lucide:trending-up" class="w-3 h-3 inline" />
                  +15% from last month
                </p>
              </div>
            </UCard>

            <UCard>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Icon name="lucide:message-square" class="w-5 h-5" />
                  <span class="text-sm">Support Tickets</span>
                </div>
                <p class="text-3xl font-bold">{{ stats.supportTickets }}</p>
                <p class="text-xs text-orange-600 dark:text-orange-400">
                  <Icon name="lucide:alert-circle" class="w-3 h-3 inline" />
                  {{ stats.supportTickets }} pending
                </p>
              </div>
            </UCard>
          </div>

          <!-- Quick Admin Actions -->
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">Quick Actions</h2>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <NuxtLink to="/admin/customers">
                <UButton variant="outline" block>
                  <Icon name="lucide:users" class="mr-2" />
                  Manage Users
                </UButton>
              </NuxtLink>

              <NuxtLink to="/admin/billing">
                <UButton variant="outline" block>
                  <Icon name="lucide:credit-card" class="mr-2" />
                  Billing Management
                </UButton>
              </NuxtLink>

              <NuxtLink to="/admin/content">
                <UButton variant="outline" block>
                  <Icon name="lucide:file-text" class="mr-2" />
                  Content Management
                </UButton>
              </NuxtLink>

              <NuxtLink to="/admin/analytics">
                <UButton variant="outline" block>
                  <Icon name="lucide:bar-chart" class="mr-2" />
                  Analytics
                </UButton>
              </NuxtLink>

              <NuxtLink to="/admin/settings">
                <UButton variant="outline" block>
                  <Icon name="lucide:settings" class="mr-2" />
                  System Settings
                </UButton>
              </NuxtLink>

              <NuxtLink to="/admin/logs">
                <UButton variant="outline" block>
                  <Icon name="lucide:terminal" class="mr-2" />
                  System Logs
                </UButton>
              </NuxtLink>
            </div>
          </UCard>

          <!-- Recent Activity -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UCard>
              <template #header>
                <h2 class="text-xl font-semibold">Recent Users</h2>
              </template>

              <div class="space-y-3">
                <div class="flex items-center gap-4 py-2 border-b last:border-b-0">
                  <div
                    class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold"
                  >
                    JD
                  </div>
                  <div class="flex-1">
                    <p class="font-medium">John Doe</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">john@example.com</p>
                  </div>
                  <span class="text-xs text-gray-500">2h ago</span>
                </div>
                <div class="flex items-center gap-4 py-2 border-b last:border-b-0">
                  <div
                    class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold"
                  >
                    JS
                  </div>
                  <div class="flex-1">
                    <p class="font-medium">Jane Smith</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">jane@example.com</p>
                  </div>
                  <span class="text-xs text-gray-500">4h ago</span>
                </div>
                <div class="flex items-center gap-4 py-2">
                  <div
                    class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold"
                  >
                    MB
                  </div>
                  <div class="flex-1">
                    <p class="font-medium">Mike Brown</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">mike@example.com</p>
                  </div>
                  <span class="text-xs text-gray-500">1d ago</span>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h2 class="text-xl font-semibold">System Status</h2>
              </template>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-green-500" />
                    <span>Database</span>
                  </div>
                  <UBadge color="success" variant="subtle">Healthy</UBadge>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-green-500" />
                    <span>API</span>
                  </div>
                  <UBadge color="success" variant="subtle">Operational</UBadge>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-green-500" />
                    <span>Billing Service</span>
                  </div>
                  <UBadge color="success" variant="subtle">Connected</UBadge>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>Email Service</span>
                  </div>
                  <UBadge color="warning" variant="subtle">Degraded</UBadge>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>
