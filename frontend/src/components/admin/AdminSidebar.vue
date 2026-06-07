<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col bg-brand-green text-white transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0"
      :class="collapsed ? 'justify-center' : ''">
      <img src="/logos/logo-white.png" alt="MYS" class="h-8 w-auto flex-shrink-0" />
      <div v-if="!collapsed" class="overflow-hidden">
        <p class="font-display font-bold text-white text-sm leading-tight">Muslim Youth</p>
        <p class="font-display text-brand-gold text-xs uppercase tracking-wider">Summit Admin</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      <template v-for="section in visibleSections" :key="section.label">
        <p v-if="!collapsed && section.label"
          class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] px-3 pt-3 pb-1">
          {{ section.label }}
        </p>
        <RouterLink v-for="link in section.links" :key="link.to" :to="link.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150"
          :class="[
            isActive(link.to)
              ? 'bg-brand-gold text-brand-green font-bold'
              : 'text-white/70 hover:text-white hover:bg-white/10',
            collapsed ? 'justify-center' : ''
          ]"
          :title="collapsed ? link.label : ''"
        >
          <span class="text-lg leading-none flex-shrink-0">{{ link.icon }}</span>
          <span v-if="!collapsed" class="truncate">{{ link.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- Bottom controls -->
    <div class="flex-shrink-0 border-t border-white/10 p-2 space-y-1">
      <button
        class="w-full flex items-center gap-3 px-3 py-2 rounded text-white/50 hover:text-white hover:bg-white/10 text-sm"
        :class="collapsed ? 'justify-center' : ''"
        @click="$emit('toggle')">
        <span class="text-lg">{{ collapsed ? '→' : '←' }}</span>
        <span v-if="!collapsed">Collapse</span>
      </button>
      <button
        class="w-full flex items-center gap-3 px-3 py-2 rounded text-white/50 hover:text-red-300 hover:bg-white/10 text-sm"
        :class="collapsed ? 'justify-center' : ''"
        @click="handleLogout">
        <span class="text-lg">⏏</span>
        <span v-if="!collapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore.js';

defineProps({ collapsed: { type: Boolean, default: false } });
defineEmits(['toggle']);

const auth   = useAuthStore();
const router = useRouter();
const route  = useRoute();

const isActive = (to) => route.path === to || route.path.startsWith(to + '/');

const allSections = [
  {
    label: 'Overview',
    links: [
      { to:'/admin/dashboard',       label:'Dashboard',       icon:'▤', roles:['super_admin','admin','attendant'] },
      { to:'/admin/event-dashboard', label:'Event Progress',  icon:'📊', roles:['super_admin','admin'] },
      { to:'/admin/reports',         label:'R&P Reports',     icon:'📋', roles:['super_admin','admin'] },
    ],
  },
  {
    label: 'Events',
    links: [
      { to:'/admin/events',       label:'All Events',   icon:'📅', roles:['super_admin','admin'] },
      { to:'/admin/categories',   label:'Categories',   icon:'🏷', roles:['super_admin','admin'] },
    ],
  },
  {
    label: 'Operations',
    links: [
      { to:'/admin/attendance',   label:'Attendance',   icon:'✅', roles:['super_admin','admin','attendant'] },
      { to:'/admin/tags',         label:'Event Tags',   icon:'🎫', roles:['super_admin','admin'] },
      { to:'/admin/gallery',      label:'Gallery',      icon:'🖼', roles:['super_admin','admin'] },
    ],
  },
  {
    label: 'Participants',
    links: [
      { to:'/admin/participants', label:'Participants',  icon:'👥', roles:['super_admin','admin'] },
      { to:'/admin/email',        label:'Email Campaigns',icon:'✉', roles:['super_admin','admin'] },
    ],
  },
  {
    label: 'System',
    links: [
      { to:'/admin/admins',       label:'Admin Users',  icon:'🔑', roles:['super_admin'] },
    ],
  },
];

const visibleSections = computed(() =>
  allSections
    .map(s => ({
      ...s,
      links: s.links.filter(l => l.roles.includes(auth.admin?.role)),
    }))
    .filter(s => s.links.length)
);

const handleLogout = () => {
  auth.logout();
  router.push('/admin/login');
};
</script>
