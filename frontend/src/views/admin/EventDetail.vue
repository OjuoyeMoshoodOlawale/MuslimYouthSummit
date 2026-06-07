<template>
  <div class="space-y-6" v-if="event">
    <!-- Header -->
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <RouterLink to="/admin/events" class="hover:text-brand-green">Events</RouterLink>
          <span>/</span><span class="text-brand-green font-semibold truncate">{{ event.title }}</span>
        </div>
        <h2 class="font-display font-bold text-2xl text-brand-green">{{ event.title }}</h2>
        <div class="flex items-center gap-3 mt-2">
          <span class="badge" :class="statusClass(event.status)">{{ event.status }}</span>
          <span class="text-sm text-gray-500">{{ event.edition }} · {{ fmt(event.start_date) }} – {{ fmt(event.end_date) }}</span>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button v-if="event.status === 'draft'"
          class="btn-green text-xs" @click="setStatus('active')">🟢 Activate</button>
        <button v-if="event.status === 'active'"
          class="btn-outline text-xs" @click="setStatus('completed')">Complete Event</button>
        <button class="btn-outline text-xs border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-green"
          @click="cloneDialog = true">📋 Clone Event</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 flex gap-6 text-sm flex-wrap">
      <button v-for="tab in tabs" :key="tab.id"
        class="pb-3 font-semibold border-b-2 transition-colors"
        :class="activeTab === tab.id ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = tab.id">{{ tab.label }}</button>
      <!-- Direct link to full schedule editor -->
      <RouterLink :to="`/admin/events/${id}/schedule`"
        class="pb-3 font-semibold border-b-2 border-transparent text-brand-gold hover:text-yellow-600 ml-auto text-xs flex items-center gap-1">
        ⊞ Full Schedule Editor →
      </RouterLink>
    </div>

    <!-- Overview tab -->
    <div v-if="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white border border-gray-100 p-6 space-y-4">
        <h3 class="font-display font-bold text-brand-green">Event Details</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex gap-3"><dt class="text-gray-400 w-24 flex-shrink-0">Tagline</dt><dd>{{ event.tagline || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-gray-400 w-24 flex-shrink-0">Venue</dt><dd>{{ event.venue || '—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-gray-400 w-24 flex-shrink-0">Early Bird</dt><dd>{{ event.early_bird_closes_at ? fmt(event.early_bird_closes_at) : '—' }}</dd></div>
        </dl>
      </div>
      <div class="bg-white border border-gray-100 p-6 space-y-4">
        <h3 class="font-display font-bold text-brand-green">Ticket Types</h3>
        <div v-for="tt in ticketTypes" :key="tt.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div>
            <p class="font-semibold text-sm">{{ tt.name }}</p>
            <p class="text-xs text-gray-400">{{ tt.quantity_sold || 0 }} sold{{ tt.quantity_available ? ` / ${tt.quantity_available}` : '' }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-brand-green">₦{{ fmt_p(tt.regular_price) }}</p>
            <p v-if="tt.early_bird_price" class="text-xs text-brand-gold">EB: ₦{{ fmt_p(tt.early_bird_price) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Speakers tab -->
    <div v-if="activeTab === 'speakers'" class="space-y-5">
      <div class="flex justify-end">
        <button class="btn-green text-xs" @click="speakerModal = true">+ Add Speaker</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="s in speakers" :key="s.id"
          class="bg-white border border-gray-100 p-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center flex-shrink-0">
            <img v-if="s.photo_url" :src="s.photo_url" class="w-full h-full rounded-full object-cover" />
            <span v-else class="font-bold text-brand-green">{{ s.name?.[0] }}</span>
          </div>
          <div>
            <p class="font-semibold text-sm">{{ s.name }}</p>
            <p class="text-xs text-brand-gold">{{ s.title }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule tab -->
    <div v-if="activeTab === 'schedule'" class="space-y-4">
      <div class="flex justify-end">
        <button class="btn-green text-xs" @click="lectureModal = true">+ Add Session</button>
      </div>
      <div v-for="lecture in lectures" :key="lecture.id"
        class="bg-white border border-gray-100 p-4 flex items-start gap-4">
        <div class="text-center flex-shrink-0 w-16">
          <p class="text-xs text-gray-400 font-semibold">{{ lecture.start_time || '--:--' }}</p>
          <p class="text-xs text-gray-300">↓</p>
          <p class="text-xs text-gray-400">{{ lecture.end_time || '' }}</p>
        </div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-gold">{{ lecture.lecture_type }}</span>
          <p class="font-semibold text-gray-800">{{ lecture.title }}</p>
          <p v-if="lecture.description" class="text-sm text-gray-500 mt-1">{{ lecture.description }}</p>
        </div>
      </div>
      <p v-if="!lectures.length" class="text-center text-gray-400 py-8">No sessions added yet.</p>
    </div>
  </div>

  <div v-else-if="loading" class="flex items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
  </div>

  <!-- Clone modal -->
  <AppModal v-model="cloneDialog" title="Clone This Event" size="md">
    <div class="space-y-4">
      <p class="text-sm text-gray-500">
        Creates a new draft event copying the ticket types, categories, days, and entire schedule.
        Specify new dates for the next edition.
      </p>
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">New Title</label>
          <input v-model="cloneForm.title" class="input text-sm" :placeholder="event?.title" />
        </div>
        <div>
          <label class="label">New Edition Code</label>
          <input v-model="cloneForm.edition" class="input text-sm" placeholder="MYS4" />
        </div>
        <div>
          <label class="label">Day Offset (days)</label>
          <input v-model.number="cloneForm.shift_days" type="number" class="input text-sm" placeholder="365" />
          <p class="text-xs text-gray-400 mt-1">Shift all dates by this many days</p>
        </div>
        <div>
          <label class="label">New Start Date</label>
          <input v-model="cloneForm.start_date" type="date" class="input text-sm" />
        </div>
        <div>
          <label class="label">New End Date</label>
          <input v-model="cloneForm.end_date" type="date" class="input text-sm" />
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <button class="btn-green text-xs" :disabled="cloning" @click="doClone">
          {{ cloning ? 'Cloning…' : '📋 Clone Now' }}
        </button>
        <button class="btn-ghost text-xs" @click="cloneDialog = false">Cancel</button>
      </div>
    </div>
  </AppModal>
    <form class="space-y-4" @submit.prevent="addSpeaker">
      <div><label class="label">Name *</label><input v-model="spk.name" class="input" /></div>
      <div><label class="label">Title / Position</label><input v-model="spk.title" class="input" placeholder="Sheikh, Dr., CEO…" /></div>
      <div><label class="label">Bio</label><textarea v-model="spk.bio" class="input" rows="3"></textarea></div>
      <div><label class="label">Photo URL</label><input v-model="spk.photo_url" class="input" /></div>
      <div class="flex gap-2 pt-2">
        <button type="submit" :disabled="saving" class="btn-green text-xs">Save Speaker</button>
        <button type="button" class="btn-ghost text-xs" @click="speakerModal = false">Cancel</button>
      </div>
    </form>
  </AppModal>

  <!-- Lecture modal -->
  <AppModal v-model="lectureModal" title="Add Session" size="md">
    <form class="space-y-4" @submit.prevent="addLecture">
      <div><label class="label">Title *</label><input v-model="lec.title" class="input" /></div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="label">Type</label>
          <select v-model="lec.lecture_type" class="input">
            <option v-for="t in ['lecture','panel','workshop','keynote','other']" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div><label class="label">Day</label>
          <select v-model="lec.event_day_id" class="input">
            <option value="">All days</option>
            <option v-for="d in eventDays" :key="d.id" :value="d.id">Day {{ d.day_number }} – {{ fmt(d.event_date) }}</option>
          </select>
        </div>
        <div><label class="label">Start Time</label><input v-model="lec.start_time" type="time" class="input" /></div>
        <div><label class="label">End Time</label><input v-model="lec.end_time" type="time" class="input" /></div>
      </div>
      <div><label class="label">Description</label><textarea v-model="lec.description" class="input" rows="2"></textarea></div>
      <div class="flex gap-2 pt-2">
        <button type="submit" :disabled="saving" class="btn-green text-xs">Save Session</button>
        <button type="button" class="btn-ghost text-xs" @click="lectureModal = false">Cancel</button>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAlertStore } from '@/stores/alertStore.js';
import AppModal from '@/components/common/AppModal.vue';
import api from '@/composables/useApi.js';

const route  = useRoute();
const router = useRouter();
const alert  = useAlertStore();
const id     = route.params.id;

const event       = ref(null);
const ticketTypes = ref([]);
const speakers    = ref([]);
const lectures    = ref([]);
const eventDays   = ref([]);
const loading     = ref(true);
const saving      = ref(false);
const activeTab   = ref('overview');
const speakerModal = ref(false);
const lectureModal = ref(false);

const spk = reactive({ name:'', title:'', bio:'', photo_url:'' });
const lec = reactive({ title:'', lecture_type:'lecture', event_day_id:'', start_time:'', end_time:'', description:'' });

const tabs = [
  { id:'overview',  label:'Overview'  },
  { id:'speakers',  label:'Speakers'  },
  { id:'schedule',  label:'Schedule'  },
];

const load = async () => {
  loading.value = true;
  try {
    const [evRes, ttRes, spRes, lcRes, dyRes] = await Promise.all([
      api.get(`/events/${id}`),
      api.get(`/events/${id}/ticket-types`),
      api.get(`/events/${id}/speakers`),
      api.get(`/events/${id}/lectures`),
      api.get(`/events/${id}/days`),
    ]);
    event.value       = evRes.data.data;
    ticketTypes.value = ttRes.data.data || [];
    speakers.value    = spRes.data.data || [];
    lectures.value    = lcRes.data.data || [];
    eventDays.value   = dyRes.data.data || [];
  } catch { alert.error('Failed to load event.'); }
  finally { loading.value = false; }
};

onMounted(load);

const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';
const fmt_p = (n) => Number(n).toLocaleString('en-NG');

const statusClass = (s) => ({
  draft:'bg-gray-100 text-gray-600', active:'bg-green-100 text-green-700',
  completed:'bg-blue-100 text-blue-700', archived:'bg-red-50 text-red-400',
}[s] ?? '');

const setStatus = async (status) => {
  if (!confirm(`Change to "${status}"?`)) return;
  try { await api.patch(`/events/${id}/status`, { status }); alert.success('Status updated.'); load(); }
  catch (err) { alert.error(err.response?.data?.message || 'Failed.'); }
};

const cloneDialog = ref(false);
const cloning     = ref(false);
const cloneForm   = reactive({ title:'', edition:'', shift_days:365, start_date:'', end_date:'' });

const doClone = async () => {
  cloning.value = true;
  try {
    const { data } = await api.post('/events/clone', {
      sourceEventId: id,
      ...cloneForm,
      shift_days: cloneForm.shift_days || 0,
    });
    alert.success(`Event cloned! Redirecting to new event…`);
    cloneDialog.value = false;
    setTimeout(() => router.push(`/admin/events/${data.data.id}`), 1000);
  } catch (err) { alert.error(err.response?.data?.message || 'Clone failed.'); }
  finally { cloning.value = false; }
};
  saving.value = true;
  try {
    await api.post(`/events/${id}/speakers`, spk);
    alert.success('Speaker added.'); speakerModal.value = false;
    Object.assign(spk, { name:'', title:'', bio:'', photo_url:'' });
    load();
  } catch { alert.error('Failed to add speaker.'); }
  finally { saving.value = false; }
};

const addLecture = async () => {
  saving.value = true;
  try {
    await api.post(`/events/${id}/lectures`, lec);
    alert.success('Session added.'); lectureModal.value = false;
    Object.assign(lec, { title:'', lecture_type:'lecture', event_day_id:'', start_time:'', end_time:'', description:'' });
    load();
  } catch { alert.error('Failed to add session.'); }
  finally { saving.value = false; }
};
</script>
