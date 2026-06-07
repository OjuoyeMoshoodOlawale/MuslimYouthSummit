<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <div class="bg-brand-green px-6 py-4 flex items-center justify-between">
      <img src="/logos/logo-white.png" alt="MYS" class="h-10" />
      <div class="text-right">
        <p class="text-white/60 text-xs uppercase tracking-widest">Check-In Station</p>
        <p class="font-bold text-sm">{{ eventStore.activeEvent?.title || 'No Active Event' }}</p>
      </div>
    </div>

    <div class="max-w-lg mx-auto p-4 space-y-4">
      <!-- Live counter -->
      <div class="grid grid-cols-3 gap-3 mt-2">
        <div class="bg-gray-800 p-3 text-center rounded">
          <p class="text-brand-gold font-bold text-2xl tabular-nums">{{ stats.checked_in ?? '—' }}</p>
          <p class="text-gray-500 text-xs uppercase tracking-wider mt-1">In</p>
        </div>
        <div class="bg-gray-800 p-3 text-center rounded">
          <p class="text-green-400 font-bold text-2xl tabular-nums">{{ onPremises }}</p>
          <p class="text-gray-500 text-xs uppercase tracking-wider mt-1">On-site</p>
        </div>
        <div class="bg-gray-800 p-3 text-center rounded">
          <p class="font-bold text-2xl tabular-nums text-gray-400">{{ stats.checked_out ?? '—' }}</p>
          <p class="text-gray-500 text-xs uppercase tracking-wider mt-1">Out</p>
        </div>
      </div>

      <!-- Scanner area -->
      <div class="bg-gray-800 rounded-lg p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-display font-bold">Scan Ticket QR</h2>
          <button class="text-xs text-gray-400 hover:text-white transition-colors"
            @click="showScanner = !showScanner">
            {{ showScanner ? 'Hide Camera' : 'Show Camera' }}
          </button>
        </div>

        <QrScanner v-if="showScanner" @scan="handleScan" />

        <div class="flex gap-2">
          <input v-model="manualInput"
            class="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 flex-1 text-sm"
            placeholder="Ticket number (e.g. MYS3-0001)"
            @keyup.enter="lookup(manualInput)" />
          <button class="btn-gold text-xs px-4" @click="lookup(manualInput)">Look Up</button>
        </div>
      </div>

      <!-- Found participant card -->
      <Transition name="slide-down">
        <div v-if="found" class="bg-white text-gray-900 rounded-lg overflow-hidden shadow-2xl">

          <!-- Status banner -->
          <div class="py-2 px-4 text-xs font-bold uppercase text-center"
            :class="{
              'bg-green-500 text-white':   found.check_in_at && !found.check_out_at,
              'bg-gray-400 text-white':    found.check_out_at,
              'bg-brand-gold text-brand-green': !found.check_in_at,
            }">
            {{ found.check_out_at ? '🚪 Checked Out' : found.check_in_at ? '✅ Already In' : '🎟 Valid Ticket' }}
          </div>

          <div class="p-5">
            <!-- Participant info -->
            <div class="flex items-center gap-4 mb-5">
              <div class="w-14 h-14 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
                <span class="text-white font-bold text-xl">{{ found.participant_name?.[0]?.toUpperCase() }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-display font-bold text-xl text-brand-green truncate">{{ found.participant_name }}</h3>
                <p class="text-sm text-gray-500 truncate">{{ found.participant_email }}</p>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{{ found.unique_number }}</span>
                  <span class="text-xs text-gray-400">{{ found.ticket_type_name }}</span>
                  <span v-if="found.category_name"
                    class="text-xs bg-brand-cream text-brand-green font-bold px-2 py-0.5 rounded">
                    {{ found.category_name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Assign tag + check in (only if not yet checked in) -->
            <div v-if="!found.check_in_at" class="space-y-3">
              <div class="border border-gray-100 p-3 rounded-lg space-y-2">
                <label class="text-sm font-semibold text-gray-700">Assign Event Tag</label>
                <div class="flex gap-2">
                  <input v-model="tagInput"
                    class="input text-sm flex-1"
                    placeholder="Scan or enter TAG-001 (optional)"
                    @keyup.enter="doCheckIn" />
                </div>
                <p class="text-xs text-gray-400">Scan the physical tag barcode, or leave blank if no tag assigned yet</p>
              </div>

              <!-- Category assignment (if event has categories and none assigned) -->
              <div v-if="categories.length && !found.category_name" class="border border-gray-100 p-3 rounded-lg">
                <label class="text-sm font-semibold text-gray-700 mb-2 block">Assign Category</label>
                <div class="grid grid-cols-2 gap-2">
                  <label v-for="c in categories" :key="c.id"
                    class="flex items-center gap-2 text-sm p-2 border-2 cursor-pointer rounded transition-all"
                    :class="selectedCategory === c.id
                      ? 'border-brand-green bg-brand-cream font-semibold'
                      : 'border-gray-100 hover:border-gray-300'">
                    <input type="radio" v-model="selectedCategory" :value="c.id" class="accent-brand-green" />
                    <span class="w-2 h-2 rounded-sm flex-shrink-0" :style="{ backgroundColor: c.color }"></span>
                    <span class="truncate">{{ c.name }}</span>
                  </label>
                </div>
              </div>

              <button
                class="w-full py-4 bg-brand-gold text-brand-green font-display font-bold uppercase tracking-wider"
                :class="{ 'opacity-70 cursor-wait': checkingIn }"
                :disabled="checkingIn"
                @click="doCheckIn">
                {{ checkingIn ? 'Checking in…' : '✅ Check In' }}
              </button>
            </div>

            <!-- Already checked in — only show checkout -->
            <div v-else-if="!found.check_out_at" class="space-y-3">
              <div class="flex items-center gap-2 text-sm bg-green-50 border border-green-100 p-3 rounded">
                <span>🏷</span>
                <span class="font-semibold text-green-700">Tag: {{ found.tag_number || 'Not assigned' }}</span>
              </div>
              <div class="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                Checked in at {{ fmtTime(found.check_in_at) }}
              </div>
              <button
                class="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded hover:bg-red-100 hover:text-red-700 transition-colors"
                :disabled="checkingOut"
                @click="doCheckOut">
                {{ checkingOut ? 'Processing…' : '🚪 Check Out' }}
              </button>
            </div>
            <div v-else class="text-center py-3 text-gray-400 text-sm">
              Checked out at {{ fmtTime(found.check_out_at) }}
            </div>
          </div>
        </div>
      </Transition>

      <!-- Not found error -->
      <Transition name="slide-down">
        <div v-if="notFoundMsg" class="bg-red-900/60 border border-red-700 rounded-lg p-4 text-center">
          <p class="text-2xl mb-2">❌</p>
          <p class="font-semibold text-red-300">Ticket Not Found</p>
          <p class="text-sm text-gray-400 mt-1">{{ notFoundMsg }}</p>
        </div>
      </Transition>

      <!-- Success flash -->
      <Transition name="slide-down">
        <div v-if="successMsg" class="bg-green-600 rounded-lg p-4 text-center">
          <p class="text-2xl mb-1">✅</p>
          <p class="font-bold text-white text-lg">{{ successMsg }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import QrScanner from '@/components/admin/QrScanner.vue';
import { useEventStore } from '@/stores/eventStore.js';
import api from '@/composables/useApi.js';

const eventStore       = useEventStore();
const showScanner      = ref(true);
const manualInput      = ref('');
const tagInput         = ref('');
const found            = ref(null);
const notFoundMsg      = ref('');
const checkingIn       = ref(false);
const checkingOut      = ref(false);
const successMsg       = ref('');
const stats            = ref({});
const categories       = ref([]);
const selectedCategory = ref(null);

const onPremises = computed(() =>
  Math.max(0, (stats.value.checked_in ?? 0) - (stats.value.checked_out ?? 0))
);

let refreshTimer;
onMounted(async () => {
  await eventStore.fetchActiveEvent();
  refreshStats();
  refreshTimer = setInterval(refreshStats, 30_000);

  if (eventStore.activeEvent) {
    try {
      const { data } = await api.get(`/events/${eventStore.activeEvent.id}/categories`);
      categories.value = (data.data || []).filter(c => c.is_active);
    } catch {}
  }
});
onUnmounted(() => clearInterval(refreshTimer));

const refreshStats = async () => {
  if (!eventStore.activeEvent) return;
  try {
    const { data } = await api.get(`/attendance/live/${eventStore.activeEvent.id}`);
    stats.value = data.data || {};
  } catch {}
};

const flash = (msg, duration = 3500) => {
  successMsg.value = msg;
  setTimeout(() => { successMsg.value = ''; }, duration);
};

const handleScan = (text) => lookup(text.trim());

const lookup = async (input) => {
  const val = (input || '').trim().toUpperCase();
  if (!val) return;
  notFoundMsg.value = '';
  found.value       = null;
  manualInput.value = '';

  try {
    const { data } = await api.get(`/tickets/by-number/${encodeURIComponent(val)}`);
    found.value         = data.data;
    tagInput.value      = '';
    selectedCategory.value = null;
  } catch (err) {
    notFoundMsg.value = err.response?.data?.message || 'Ticket not found.';
    setTimeout(() => { notFoundMsg.value = ''; }, 4000);
  }
};

const doCheckIn = async () => {
  if (!found.value || checkingIn.value) return;
  checkingIn.value = true;

  // Optionally assign category first
  if (selectedCategory.value) {
    try {
      await api.patch(`/tickets/${found.value.id}/category`, { category_id: selectedCategory.value });
    } catch {}
  }

  try {
    const { data } = await api.post('/attendance/checkin', {
      ticket_id:  found.value.id,
      event_id:   eventStore.activeEvent.id,
      tag_number: tagInput.value.trim() || null,
    });
    flash(`${found.value.participant_name} checked in!${tagInput.value ? ' Tag: ' + tagInput.value.toUpperCase() : ''}`);
    found.value = null;
    refreshStats();
  } catch (err) {
    alert(err.response?.data?.message || 'Check-in failed.');
  } finally {
    checkingIn.value = false;
  }
};

const doCheckOut = async () => {
  if (!found.value || checkingOut.value) return;
  checkingOut.value = true;
  try {
    await api.post('/attendance/checkout', {
      ticket_id:     found.value.id,
      attendance_id: found.value.attendance_id,
    });
    flash(`${found.value.participant_name} checked out.`);
    found.value = null;
    refreshStats();
  } catch (err) {
    alert(err.response?.data?.message || 'Check-out failed.');
  } finally {
    checkingOut.value = false;
  }
};

const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' })
  : '';
</script>

<style scoped>
.slide-down-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from   { opacity:0; transform:translateY(-16px); }
.slide-down-leave-to     { opacity:0; transform:translateY(-8px); }
</style>
