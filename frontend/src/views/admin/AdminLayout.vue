<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <AdminSidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />

    <!-- Main area -->
    <div class="flex-1 flex flex-col min-h-screen transition-all duration-300"
      :style="{ marginLeft: collapsed ? '64px' : '256px' }">
      <!-- Header -->
      <AdminHeader :title="routeTitle" />

      <!-- Content -->
      <main class="flex-1 p-6 overflow-auto">
        <RouterView />
      </main>

      <!-- Footer -->
      <footer class="text-center py-3 text-xs text-gray-300 border-t border-gray-100 bg-white">
        MYS Admin Platform &copy; {{ new Date().getFullYear() }} · Muslim Youth Summit
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import AdminHeader  from '@/components/admin/AdminHeader.vue';

const collapsed = ref(false);
const route     = useRoute();

const titles = {
  'admin-dashboard':       'Dashboard',
  'admin-event-dashboard': 'Event Progress',
  'admin-reports':         'R&P Reports',
  'admin-events':          'Events',
  'admin-event-create':    'Create Event',
  'admin-event-detail':    'Event Detail',
  'admin-schedule':        'Event Schedule',
  'admin-categories':      'Event Categories',
  'admin-attendance':      'Attendance',
  'admin-gallery':         'Gallery',
  'admin-participants':    'Participants',
  'admin-manual-register': 'Manual Registration',
  'admin-email':           'Email Campaigns',
  'admin-tags':            'Event Tags',
  'admin-admins':          'Admin Accounts',
};

const routeTitle = computed(() => titles[route.name] || 'Admin');
</script>
