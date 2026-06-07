<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
    <!-- Page title -->
    <div>
      <h1 class="font-display font-bold text-xl text-brand-green">{{ title }}</h1>
      <p v-if="subtitle" class="text-xs text-gray-500 mt-0.5">{{ subtitle }}</p>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-4">
      <!-- Active event badge -->
      <div v-if="activeEventStore.hasActiveEvent" class="hidden sm:flex items-center gap-2 bg-brand-cream border border-brand-gold/30 px-3 py-1.5 rounded">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span class="text-xs font-semibold text-brand-green truncate max-w-[160px]">
          {{ activeEventStore.activeEvent?.title }}
        </span>
      </div>

      <!-- Admin info -->
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-semibold text-gray-800">{{ auth.admin?.name }}</p>
          <p class="text-xs text-gray-400 capitalize">{{ auth.admin?.role?.replace('_',' ') }}</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
          <span class="text-white font-bold text-sm">{{ initials }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore.js';
import { useEventStore } from '@/stores/eventStore.js';

defineProps({
  title:    { type: String, default: 'Dashboard' },
  subtitle: { type: String, default: '' },
});

const auth             = useAuthStore();
const activeEventStore = useEventStore();

const initials = computed(() =>
  (auth.admin?.name || 'A').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
);
</script>
