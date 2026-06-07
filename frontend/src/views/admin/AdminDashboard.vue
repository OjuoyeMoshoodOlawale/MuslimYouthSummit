<template>
  <div class="space-y-6">
    <!-- Stats grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsWidget label="Tickets Sold"    :value="stats.tickets"     icon="🎟" iconBg="bg-brand-cream" />
      <StatsWidget label="Checked In"      :value="stats.checkedIn"   icon="✅" iconBg="bg-green-50" />
      <StatsWidget label="Tags Assigned"   :value="stats.tags"        icon="🏷" iconBg="bg-yellow-50" />
      <StatsWidget label="Total Participants" :value="stats.participants" icon="👥" iconBg="bg-blue-50" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Active event card -->
      <div v-if="event" class="bg-brand-green text-white p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1">Active Event</p>
            <h2 class="font-display font-bold text-xl">{{ event.title }}</h2>
            <p class="text-white/60 text-sm mt-1">{{ formatDate(event.start_date) }} – {{ formatDate(event.end_date) }}</p>
          </div>
          <span class="flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>LIVE
          </span>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p class="text-white/50 text-xs uppercase tracking-wider">Venue</p>
            <p class="text-white font-semibold text-sm mt-0.5">{{ event.venue || '—' }}</p>
          </div>
          <div>
            <p class="text-white/50 text-xs uppercase tracking-wider">Edition</p>
            <p class="text-white font-semibold text-sm mt-0.5">{{ event.edition }}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-5">
          <RouterLink :to="`/admin/events/${event.id}`" class="btn-gold text-xs py-2 px-4">Manage →</RouterLink>
          <RouterLink to="/admin/attendance" class="btn-outline border-white/30 text-white text-xs py-2 px-4 hover:bg-white/10 hover:text-white">Attendance</RouterLink>
        </div>
      </div>
      <div v-else class="bg-gray-50 border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
        <p class="text-3xl mb-3">📅</p>
        <p class="text-gray-500 text-sm font-medium">No active event</p>
        <RouterLink to="/admin/events/new" class="btn-green mt-4 text-xs py-2">Create Event</RouterLink>
      </div>

      <!-- Recent activity -->
      <div class="bg-white border border-gray-100 p-6">
        <h3 class="font-display font-bold text-base text-brand-green mb-4">Recent Check-ins</h3>
        <div v-if="recentCheckIns.length" class="space-y-3">
          <div v-for="c in recentCheckIns" :key="c.id"
            class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <div class="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center flex-shrink-0">
              <span class="text-brand-green font-bold text-sm">{{ c.name?.[0] }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ c.name }}</p>
              <p class="text-xs text-gray-400">{{ c.unique_number }}</p>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0">{{ timeAgo(c.checked_in_at) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-6">No check-ins yet</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useEventStore } from '@/stores/eventStore.js';
import StatsWidget from '@/components/admin/StatsWidget.vue';
import api from '@/composables/useApi.js';

const eventStore = useEventStore();
const event = ref(null);
const stats = ref({ tickets: 0, checkedIn: 0, tags: 0, participants: 0 });
const recentCheckIns = ref([]);

onMounted(async () => {
  await eventStore.fetchActiveEvent();
  event.value = eventStore.activeEvent;
  if (event.value) {
    try {
      const [sRes, aRes] = await Promise.all([
        api.get(`/tickets/admin/stats/${event.value.id}`),
        api.get(`/attendance/live/${event.value.id}`),
      ]);
      stats.value = {
        tickets:      sRes.data.data?.total_sold ?? 0,
        checkedIn:    sRes.data.data?.checked_in ?? 0,
        tags:         sRes.data.data?.tags_assigned ?? 0,
        participants: sRes.data.data?.participants ?? 0,
      };
      recentCheckIns.value = (aRes.data.data?.recent ?? []).slice(0,6);
    } catch {}
  }
});

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : '—';
const timeAgo = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins/60)}h ago`;
};
</script>
