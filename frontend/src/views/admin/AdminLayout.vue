<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar overlay for mobile -->
    <div v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"></div>

    <!-- Sidebar -->
    <aside class="fixed top-0 left-0 h-full z-50 transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
      <AdminSidebar :collapsed="sidebarCollapsed" />
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'">

      <!-- Top bar -->
      <header class="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 h-16 flex items-center gap-4">
        <!-- Mobile hamburger -->
        <button class="lg:hidden text-gray-500 hover:text-brand-green p-1 -ml-1"
          @click="sidebarOpen = !sidebarOpen">
          <Menu :size="22" />
        </button>

        <!-- Desktop sidebar toggle -->
        <button class="hidden lg:flex text-gray-400 hover:text-brand-green transition-colors"
          @click="sidebarCollapsed = !sidebarCollapsed">
          <PanelLeft :size="18" />
        </button>

        <div class="flex-1 min-w-0">
          <h1 class="font-display font-bold text-brand-green text-lg truncate">{{ pageTitle }}</h1>
        </div>

        <!-- Right: alerts badge, user -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <!-- Pending expenses badge -->
          <RouterLink v-if="isAdmin" to="/admin/expenses"
            class="relative text-gray-500 hover:text-brand-green transition-colors"
            title="Expense Requests">
            <ReceiptText :size="18" />
            <span v-if="pendingExpenses > 0"
              class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {{ pendingExpenses > 9 ? '9+' : pendingExpenses }}
            </span>
          </RouterLink>

          <!-- User menu -->
          <div class="relative" ref="userMenuRef">
            <button class="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-green transition-colors"
              @click="userMenuOpen = !userMenuOpen">
              <div class="w-8 h-8 bg-brand-green flex items-center justify-center text-white font-bold text-xs rounded-sm">
                {{ auth.admin?.name?.[0]?.toUpperCase() }}
              </div>
              <span class="hidden md:block font-semibold max-w-[120px] truncate">{{ auth.admin?.name }}</span>
              <ChevronDown :size="14" :class="userMenuOpen ? 'rotate-180' : ''" class="transition-transform hidden md:block" />
            </button>

            <Transition name="dropdown">
              <div v-if="userMenuOpen"
                class="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-lg z-50 py-1">
                <div class="px-3 py-2 border-b border-gray-100">
                  <p class="text-xs font-bold text-gray-800 truncate">{{ auth.admin?.name }}</p>
                  <p class="text-xs text-gray-400 capitalize">{{ auth.admin?.role?.replace('_',' ') }}</p>
                </div>
                <RouterLink to="/admin/settings" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green transition-colors"
                  @click="userMenuOpen=false">
                  <Settings :size="14" /> Settings
                </RouterLink>
                <RouterLink to="/" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  @click="userMenuOpen=false" target="_blank">
                  <ExternalLink :size="14" /> View Site
                </RouterLink>
                <button class="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  @click="handleLogout">
                  <LogOut :size="14" /> Sign Out
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 md:p-6 overflow-x-hidden">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Menu, PanelLeft, ChevronDown, ReceiptText, Settings, LogOut, ExternalLink } from 'lucide-vue-next';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { useAuthStore } from '@/stores/authStore.js';
import { useAlertStore } from '@/stores/alertStore.js';
import api from '@/composables/useApi.js';

const auth   = useAuthStore();
const alert  = useAlertStore();
const route  = useRouter();
const router = useRouter();

const sidebarOpen      = ref(false);
const sidebarCollapsed = ref(false);
const userMenuOpen     = ref(false);
const userMenuRef      = ref(null);
const pendingExpenses  = ref(0);

const isAdmin = computed(() => ['super_admin','admin'].includes(auth.admin?.role));

const pageTitles = {
  'admin-dashboard':       'Dashboard',
  'admin-event-dashboard': 'Event Progress',
  'admin-reports':         'R&P Reports',
  'admin-events':          'All Events',
  'admin-event-create':    'Create Event',
  'admin-event-detail':    'Event Detail',
  'admin-schedule':        'Schedule Editor',
  'admin-ticket-types':    'Ticket Pricing',
  'admin-categories':      'Categories',
  'admin-attendance':      'Attendance',
  'admin-tags':            'Event Tags',
  'admin-hostels':         'Hostels',
  'admin-gallery':         'Gallery',
  'admin-participants':    'Participants',
  'admin-manual-register': 'Manual Register',
  'admin-email':           'Email Campaigns',
  'admin-departments':     'Departments',
  'admin-expenses':        'Expense Requests',
  'admin-souvenirs':       'Souvenirs & Merchandise',
  'admin-sponsors':        'Sponsors & Partners',
  'admin-admins':          'Admin Users',
  'admin-settings':        'My Settings',
};

const currentRoute = computed(() => useRoute());
const pageTitle = computed(() => {
  const r = useRoute();
  return pageTitles[r.name] || 'Admin Panel';
});

// Close user menu on outside click
const handleOutsideClick = (e) => {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userMenuOpen.value = false;
  }
};

// Close mobile sidebar on route change
const handleRouteChange = () => { sidebarOpen.value = false; };

onMounted(async () => {
  document.addEventListener('click', handleOutsideClick);
  window.addEventListener('popstate', handleRouteChange);

  // Load pending expenses count
  if (isAdmin.value) {
    try {
      const { data } = await api.get('/expenses?status=pending');
      pendingExpenses.value = (data.data || []).length;
    } catch {}
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  window.removeEventListener('popstate', handleRouteChange);
});

const handleLogout = () => {
  auth.logout();
  router.push('/admin/login');
};
</script>

<style scoped>
.dropdown-enter-active { transition: all 0.15s ease; }
.dropdown-leave-active { transition: all 0.1s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
