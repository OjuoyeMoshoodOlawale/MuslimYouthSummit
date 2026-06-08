<template>
  <div class="space-y-6">
    <!-- Stats grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsWidget label="Tickets Sold"      :value="stats.total_sold"    :icon="Ticket"     iconBg="bg-brand-cream" />
      <StatsWidget label="Checked In"        :value="stats.checked_in"    :icon="ShieldCheck" iconBg="bg-green-50"  iconColor="text-green-600" />
      <StatsWidget label="Tags Assigned"     :value="stats.tags_assigned" :icon="Tag"        iconBg="bg-yellow-50" iconColor="text-yellow-600" />
      <StatsWidget label="Participants"      :value="stats.participants"  :icon="Users"      iconBg="bg-blue-50"   iconColor="text-blue-600" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Active event card -->
      <div v-if="event" class="bg-brand-green text-white p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Radio :size="11" class="animate-pulse" /> Active Event
            </p>
            <h2 class="font-display font-bold text-xl">{{ event.title }}</h2>
            <p class="text-white/60 text-sm mt-1">{{ formatDate(event.start_date) }} – {{ formatDate(event.end_date) }}</p>
          </div>
          <span class="flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-bold px-2.5 py-1">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> LIVE
          </span>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p class="text-white/50 text-xs uppercase tracking-wider">Venue</p>
            <p class="text-white font-semibold text-sm mt-0.5 truncate">{{ event.venue || '—' }}</p>
          </div>
          <div>
            <p class="text-white/50 text-xs uppercase tracking-wider">Revenue</p>
            <p class="text-white font-semibold text-sm mt-0.5">₦{{ fmtP(stats.total_revenue) }}</p>
          </div>
        </div>
        <!-- Progress bar -->
        <div class="mt-4" v-if="stats.participants">
          <div class="flex justify-between text-xs text-white/50 mb-1.5">
            <span>Check-in progress</span>
            <span>{{ stats.checked_in }} / {{ stats.participants }}</span>
          </div>
          <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-brand-gold rounded-full transition-all duration-700"
              :style="{ width: `${Math.min(100, (stats.checked_in / stats.participants) * 100)}%` }"></div>
          </div>
        </div>
        <div class="flex gap-2 mt-5">
          <RouterLink :to="`/admin/events/${event.id}`" class="btn-gold text-xs py-2 px-4">
            <ArrowRight :size="12" /> Manage Event
          </RouterLink>
          <RouterLink to="/admin/attendance" class="text-white/70 hover:text-white text-xs py-2 px-4 border border-white/20 hover:border-white/40 transition-colors flex items-center gap-1.5">
            <ShieldCheck :size="12" /> Attendance
          </RouterLink>
          <RouterLink to="/check-in" class="text-white/70 hover:text-white text-xs py-2 px-4 border border-white/20 hover:border-white/40 transition-colors flex items-center gap-1.5">
            <QrCode :size="12" /> Check-In
          </RouterLink>
        </div>
      </div>

      <div v-else class="bg-gray-50 border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center">
        <CalendarX :size="40" class="text-gray-300 mb-3" />
        <p class="text-gray-500 text-sm font-semibold">No Active Event</p>
        <p class="text-gray-400 text-xs mt-1 mb-4">Create or activate an event to start managing.</p>
        <RouterLink to="/admin/events/new" class="btn-green text-xs py-2">
          <Plus :size="13" /> Create Event
        </RouterLink>
      </div>

      <!-- Recent check-ins -->
      <div class="bg-white border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-bold text-base text-brand-green">Recent Check-ins</h3>
          <RouterLink to="/admin/attendance" class="text-xs text-brand-green hover:underline flex items-center gap-1">
            View all <ArrowRight :size="11" />
          </RouterLink>
        </div>
        <div v-if="recentCheckIns.length" class="space-y-2.5">
          <div v-for="c in recentCheckIns" :key="c.id"
            class="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div class="w-8 h-8 bg-brand-cream flex items-center justify-center flex-shrink-0">
              <span class="text-brand-green font-bold text-sm">{{ c.name?.[0]?.toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ c.name }}</p>
              <p class="text-xs text-gray-400 flex items-center gap-1">
                <Tag :size="9" class="flex-shrink-0" /> {{ c.tag_number || c.unique_number }}
              </p>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0">{{ timeAgo(c.checked_in_at) }}</span>
          </div>
        </div>
        <div v-else-if="loading" class="flex justify-center py-8">
          <Loader :size="22" class="animate-spin text-gray-300" />
        </div>
        <p v-else class="text-sm text-gray-300 text-center py-6">No check-ins yet</p>
      </div>
    </div>

    <!-- Pending expense requests -->
    <div v-if="pendingExpenses.length" class="bg-white border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display font-bold text-base text-brand-green flex items-center gap-2">
          <ReceiptText :size="16" />
          Pending Expense Approvals
          <span class="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {{ pendingExpenses.length }}
          </span>
        </h3>
        <RouterLink to="/admin/expenses" class="text-xs text-brand-green hover:underline flex items-center gap-1">
          View all <ArrowRight :size="11" />
        </RouterLink>
      </div>
      <div class="space-y-2">
        <div v-for="e in pendingExpenses.slice(0,4)" :key="e.id"
          class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <Clock :size="14" class="text-yellow-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">{{ e.title }}</p>
              <p class="text-xs text-gray-400">{{ e.department_name }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-brand-green text-sm">₦{{ fmtP(e.amount_requested) }}</p>
            <span class="badge text-xs" :class="e.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'">
              {{ e.priority }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  Ticket, ShieldCheck, Tag, Users, Radio, ArrowRight, QrCode,
  CalendarX, Plus, Loader, ReceiptText, Clock
} from 'lucide-vue-next';
import { useEventStore } from '@/stores/eventStore.js';
import StatsWidget from '@/components/admin/StatsWidget.vue';
import api from '@/composables/useApi.js';

const eventStore      = useEventStore();
const event           = ref(null);
const loading         = ref(true);
const stats           = ref({ total_sold:0, checked_in:0, tags_assigned:0, participants:0, total_revenue:0 });
const recentCheckIns  = ref([]);
const pendingExpenses = ref([]);

onMounted(async () => {
  loading.value = true;
  try {
    await eventStore.fetchActiveEvent();
    event.value = eventStore.activeEvent;

    const promises = [api.get('/expenses?status=pending')];
    if (event.value) {
      promises.push(
        api.get(`/tickets/admin/stats/${event.value.id}`),
        api.get(`/attendance/live/${event.value.id}`),
      );
    }
    const results = await Promise.allSettled(promises);

    if (results[0]?.status === 'fulfilled') {
      pendingExpenses.value = results[0].value.data.data || [];
    }
    if (event.value && results[1]?.status === 'fulfilled') {
      stats.value = { ...stats.value, ...results[1].value.data.data };
    }
    if (event.value && results[2]?.status === 'fulfilled') {
      const live = results[2].value.data.data;
      stats.value.checked_in = live.checked_in || 0;
      recentCheckIns.value   = live.recent || [];
    }
  } catch (e) {
    console.error('Dashboard load error:', e);
  } finally {
    loading.value = false;
  }
});

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : '—';
const fmtP      = (n) => Number(n||0).toLocaleString('en-NG');
const timeAgo   = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins/60)}h ago`;
};
</script>
