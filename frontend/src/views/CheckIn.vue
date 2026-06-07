<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <div class="bg-brand-green px-6 py-4 flex items-center justify-between">
      <img src="/logos/logo-white.png" alt="MYS" class="h-10" />
      <div class="text-right">
        <p class="text-white/60 text-xs">Check-In Station</p>
        <p class="font-bold text-sm">{{ eventStore.activeEvent?.title || 'No Active Event' }}</p>
      </div>
    </div>

    <div class="max-w-lg mx-auto p-6 space-y-6">
      <!-- Live counter -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-gray-800 p-3 text-center rounded">
          <p class="text-brand-gold font-bold text-2xl">{{ stats.checked_in ?? '—' }}</p>
          <p class="text-gray-500 text-xs uppercase tracking-wider mt-1">In</p>
        </div>
        <div class="bg-gray-800 p-3 text-center rounded">
          <p class="font-bold text-2xl">{{ stats.checked_out ?? '—' }}</p>
          <p class="text-gray-500 text-xs uppercase tracking-wider mt-1">Out</p>
        </div>
        <div class="bg-gray-800 p-3 text-center rounded">
          <p class="text-green-400 font-bold text-2xl">{{ stats.on_premises ?? '—' }}</p>
          <p class="text-gray-500 text-xs uppercase tracking-wider mt-1">On-site</p>
        </div>
      </div>

      <!-- Scanner -->
      <div class="bg-gray-800 rounded p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-display font-bold">Scan Ticket QR</h2>
          <button class="text-xs text-gray-400 hover:text-white" @click="showScanner = !showScanner">
            {{ showScanner ? 'Hide Camera' : 'Show Camera' }}
          </button>
        </div>
        <QrScanner v-if="showScanner" @scan="handleScan" />
        <!-- Manual input fallback -->
        <div class="flex gap-2">
          <input v-model="manualInput" class="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 flex-1"
            placeholder="Enter ticket number (e.g. MYS3-0001)"
            @keyup.enter="lookup(manualInput)" />
          <button class="btn-gold text-xs px-4" @click="lookup(manualInput)">Look Up</button>
        </div>
      </div>

      <!-- Participant found -->
      <Transition name="slide">
        <div v-if="found" class="bg-white text-gray-900 rounded overflow-hidden shadow-xl">
          <!-- Status bar -->
          <div class="py-2 px-4 text-xs font-bold uppercase text-center"
            :class="found.check_in_at ? 'bg-green-500 text-white' : 'bg-brand-gold text-brand-green'">
            {{ found.check_in_at ? (found.check_out_at ? '🚪 Checked Out' : '✅ Already Checked In') : '🎟 Valid Ticket' }}
          </div>

          <div class="p-5">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
                <span class="text-white font-bold text-xl">{{ found.participant_name?.[0] }}</span>
              </div>
              <div>
                <h3 class="font-display font-bold text-xl text-brand-green">{{ found.participant_name }}</h3>
                <p class="text-sm text-gray-500">{{ found.participant_email }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ found.unique_number }} · {{ found.ticket_type_name }}</p>
              </div>
            </div>

            <!-- Tag assignment -->
            <div v-if="!found.check_in_at" class="space-y-3">
              <p class="text-sm font-semibold text-gray-700">Assign Event Tag:</p>
              <div class="flex gap-2">
                <input v-model="tagInput" class="input flex-1 text-sm" placeholder="Scan tag barcode or enter TAG-001" />
                <button class="btn-green text-xs px-4" :disabled="checkingIn" @click="doCheckIn">
                  {{ checkingIn ? '…' : 'Check In' }}
                </button>
              </div>
              <p class="text-xs text-gray-400">Scan the tag number barcode or type it manually</p>
            </div>

            <div v-else-if="!found.check_out_at" class="flex gap-2 mt-3">
              <button class="btn-outline text-xs flex-1 border-red-300 text-red-500 hover:bg-red-50"
                :disabled="checkingOut" @click="doCheckOut">
                {{ checkingOut ? 'Processing…' : '🚪 Check Out' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Not found -->
      <div v-if="notFound" class="bg-red-900/50 border border-red-700 rounded p-4 text-center">
        <p class="text-2xl mb-2">❌</p>
        <p class="font-semibold text-red-300">Ticket Not Found</p>
        <p class="text-sm text-gray-400 mt-1">{{ notFoundMsg }}</p>
      </div>

      <!-- Success flash -->
      <Transition name="slide">
        <div v-if="successMsg" class="bg-green-600 rounded p-4 text-center">
          <p class="text-2xl mb-1">✅</p>
          <p class="font-bold text-white">{{ successMsg }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import QrScanner from '@/components/admin/QrScanner.vue';
import { useEventStore } from '@/stores/eventStore.js';
import api from '@/composables/useApi.js';

const eventStore  = useEventStore();
const showScanner = ref(true);
const manualInput = ref('');
const tagInput    = ref('');
const found       = ref(null);
const notFound    = ref(false);
const notFoundMsg = ref('');
const checkingIn  = ref(false);
const checkingOut = ref(false);
const successMsg  = ref('');
const stats       = ref({});

onMounted(async () => {
  await eventStore.fetchActiveEvent();
  refreshStats();
  setInterval(refreshStats, 30_000);
});

const refreshStats = async () => {
  if (!eventStore.activeEvent) return;
  try {
    const { data } = await api.get(`/attendance/live/${eventStore.activeEvent.id}`);
    stats.value = data.data || {};
  } catch {}
};

const flash = (msg) => {
  successMsg.value = msg;
  setTimeout(() => { successMsg.value = ''; }, 3000);
};

const handleScan = (text) => lookup(text);

const lookup = async (input) => {
  const val = (input || '').trim().toUpperCase();
  if (!val) return;
  notFound.value = false;
  found.value    = null;
  try {
    const { data } = await api.get(`/tickets/by-number/${val}`);
    found.value    = data.data;
    tagInput.value = '';
    manualInput.value = '';
  } catch (err) {
    notFound.value  = true;
    notFoundMsg.value = err.response?.data?.message || 'Ticket not found.';
  }
};

const doCheckIn = async () => {
  if (!found.value || !tagInput.value.trim()) return;
  checkingIn.value = true;
  try {
    await api.post('/attendance/checkin', {
      ticket_id:      found.value.id,
      event_id:       eventStore.activeEvent.id,
      tag_number:     tagInput.value.trim().toUpperCase(),
    });
    flash(`${found.value.participant_name} checked in! Tag: ${tagInput.value.toUpperCase()}`);
    found.value = null; tagInput.value = ''; refreshStats();
  } catch (err) {
    alert(err.response?.data?.message || 'Check-in failed.');
  } finally { checkingIn.value = false; }
};

const doCheckOut = async () => {
  if (!found.value) return;
  checkingOut.value = true;
  try {
    await api.post('/attendance/checkout', { ticket_id: found.value.id });
    flash(`${found.value.participant_name} checked out.`);
    found.value = null; refreshStats();
  } catch (err) {
    alert(err.response?.data?.message || 'Check-out failed.');
  } finally { checkingOut.value = false; }
};
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to       { opacity: 0; transform: translateY(-12px); }
</style>
