<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col bg-brand-green text-white transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0" :class="collapsed ? 'justify-center' : ''">
      <img src="/logos/logo-white.png" alt="MYS" class="h-8 w-auto flex-shrink-0" />
      <div v-if="!collapsed" class="overflow-hidden">
        <p class="font-display font-bold text-white text-sm leading-tight">Muslim Youth</p>
        <p class="font-display text-brand-gold text-xs uppercase tracking-wider">Summit Admin</p>
      </div>
    </div>

    <!-- Nav links -->
    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1">
      <SidebarLink v-for="link in visibleLinks" :key="link.to"
        :link="link" :collapsed="collapsed" />
    </nav>

    <!-- Bottom: collapse toggle + logout -->
    <div class="flex-shrink-0 border-t border-white/10 p-2 space-y-1">
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
        :class="collapsed ? 'justify-center' : ''"
        @click="$emit('toggle')"
      >
        <span class="text-lg">{{ collapsed ? '→' : '←' }}</span>
        <span v-if="!collapsed">Collapse</span>
      </button>
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded text-white/60 hover:text-red-300 hover:bg-white/10 transition-colors text-sm"
        :class="collapsed ? 'justify-center' : ''"
        @click="handleLogout"
      >
        <span class="text-lg">⏏</span>
        <span v-if="!collapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, h, resolveComponent } from 'vue';
import { RouterLink, useLink } from 'vue-router';
import { useAuthStore } from '@/stores/authStore.js';
import { useRouter } from 'vue-router';

defineProps({ collapsed: { type: Boolean, default: false } });
defineEmits(['toggle']);

const auth   = useAuthStore();
const router = useRouter();

const allLinks = [
  { to: '/admin/dashboard',    label: 'Dashboard',    icon: '▤', roles: ['super_admin','admin','attendant'] },
  { to: '/admin/events',       label: 'Events',       icon: '📅', roles: ['super_admin','admin'] },
  { to: '/admin/attendance',   label: 'Attendance',   icon: '✅', roles: ['super_admin','admin','attendant'] },
  { to: '/admin/tags',         label: 'Event Tags',   icon: '🏷', roles: ['super_admin','admin'] },
  { to: '/admin/gallery',      label: 'Gallery',      icon: '🖼', roles: ['super_admin','admin'] },
  { to: '/admin/participants',  label: 'Participants', icon: '👥', roles: ['super_admin','admin'] },
  { to: '/admin/email',        label: 'Email Campaigns', icon: '✉', roles: ['super_admin','admin'] },
  { to: '/admin/admins',       label: 'Admins',       icon: '🔑', roles: ['super_admin'] },
];

const visibleLinks = computed(() =>
  allLinks.filter(l => l.roles.includes(auth.admin?.role))
);

const handleLogout = () => {
  auth.logout();
  router.push('/admin/login');
};
</script>

<script>
// SidebarLink sub-component
const SidebarLink = {
  props: { link: Object, collapsed: Boolean },
  setup(props) {
    const { isActive } = useLink({ to: props.link.to });
    return { isActive };
  },
  template: `
    <RouterLink :to="link.to"
      class="flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 text-sm group"
      :class="[
        isActive
          ? 'bg-brand-gold text-brand-green font-bold'
          : 'text-white/70 hover:text-white hover:bg-white/10',
        collapsed ? 'justify-center' : ''
      ]"
      :title="collapsed ? link.label : ''"
    >
      <span class="text-lg leading-none flex-shrink-0">{{ link.icon }}</span>
      <span v-if="!collapsed" class="truncate">{{ link.label }}</span>
    </RouterLink>
  `,
};
export default { components: { SidebarLink } };
</script>
