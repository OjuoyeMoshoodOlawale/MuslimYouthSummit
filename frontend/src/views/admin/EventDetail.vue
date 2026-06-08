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
        <div class="flex items-center gap-3 mt-2 flex-wrap">
          <span class="badge" :class="statusClass(event.status)">{{ event.status }}</span>
          <span class="text-sm text-gray-500">{{ event.edition }} · {{ fmt(event.start_date) }} – {{ fmt(event.end_date) }}</span>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button v-if="event.status==='draft'"
          class="btn-green text-xs" @click="setStatus('active')">🟢 Activate</button>
        <button v-if="event.status==='active'"
          class="btn-outline text-xs" @click="setStatus('completed')">Complete</button>
        <button class="btn-outline text-xs border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-green"
          @click="cloneDialog=true">📋 Clone</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 flex gap-6 text-sm flex-wrap">
      <button v-for="tab in tabs" :key="tab.id"
        class="pb-3 font-semibold border-b-2 transition-colors"
        :class="activeTab===tab.id ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab=tab.id">{{ tab.label }}</button>
      <RouterLink :to="`/admin/events/${id}/schedule`"
        class="pb-3 font-semibold border-b-2 border-transparent text-brand-gold hover:text-yellow-600 ml-auto text-xs flex items-center gap-1">
        ⊞ Full Schedule Editor →
      </RouterLink>
    </div>

    <!-- Overview tab -->
    <div v-if="activeTab==='overview'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white border border-gray-100 p-6 space-y-4">
        <h3 class="font-display font-bold text-brand-green">Event Details</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex gap-3"><dt class="text-gray-400 w-28 flex-shrink-0">Tagline</dt><dd>{{ event.tagline||'—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-gray-400 w-28 flex-shrink-0">Venue</dt><dd>{{ event.venue||'—' }}</dd></div>
          <div class="flex gap-3"><dt class="text-gray-400 w-28 flex-shrink-0">Early Bird</dt><dd>{{ event.early_bird_closes_at ? fmt(event.early_bird_closes_at) : '—' }}</dd></div>
        </dl>
      </div>
      <div class="bg-white border border-gray-100 p-6 space-y-3">
        <h3 class="font-display font-bold text-brand-green">Ticket Types</h3>
        <div v-for="tt in ticketTypes" :key="tt.id"
          class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div>
            <p class="font-semibold text-sm">{{ tt.name }}</p>
            <p class="text-xs text-gray-400">{{ tt.quantity_sold||0 }} sold{{ tt.quantity_available?` / ${tt.quantity_available}`:'' }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-brand-green text-sm">₦{{ fmtP(tt.regular_price) }}</p>
            <p v-if="tt.early_bird_price" class="text-xs text-brand-gold">EB: ₦{{ fmtP(tt.early_bird_price) }}</p>
          </div>
        </div>
        <p v-if="!ticketTypes.length" class="text-sm text-gray-400">No ticket types yet.</p>
      </div>
    </div>

    <!-- Speakers tab -->
    <div v-if="activeTab==='speakers'" class="space-y-4">
      <div class="flex justify-end">
        <button class="btn-green text-xs" @click="speakerModal=true">+ Add Speaker</button>
      </div>
      <div v-if="speakers.length" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="s in speakers" :key="s.id"
          class="bg-white border border-gray-100 p-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center flex-shrink-0">
            <img v-if="s.photo_url" :src="s.photo_url" class="w-full h-full rounded-full object-cover" :alt="s.name" />
            <span v-else class="font-bold text-brand-green">{{ s.name?.[0] }}</span>
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-sm truncate">{{ s.name }}</p>
            <p class="text-xs text-brand-gold truncate">{{ s.title }}</p>
          </div>
        </div>
      </div>
      <p v-else class="text-gray-400 text-sm text-center py-8">No speakers added yet.</p>
    </div>

    <!-- Schedule preview tab -->
    <div v-if="activeTab==='schedule'" class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-500">Preview only — use the Full Schedule Editor for complete management.</p>
        <button class="btn-green text-xs" @click="lectureModal=true">+ Quick Add</button>
      </div>
      <div v-if="lectures.length" class="bg-white border border-gray-100 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-brand-green text-white">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-10">S/N</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Time</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Title</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Lecturer</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">Facilitators</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(l, i) in lectures" :key="l.id"
              class="border-b border-gray-50 hover:bg-brand-cream/30">
              <td class="px-4 py-3 font-mono font-bold text-brand-gold text-center">{{ l.s_n||i+1 }}</td>
              <td class="px-4 py-3 text-xs text-brand-green font-semibold whitespace-nowrap">
                {{ l.start_time||'—' }}<span v-if="l.end_time"> – {{ l.end_time }}</span>
              </td>
              <td class="px-4 py-3 font-semibold text-gray-800">{{ l.title }}</td>
              <td class="px-4 py-3 text-gray-600">{{ l.main_speaker_name||'—' }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{{ l.facilitators||'—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-center text-gray-400 text-sm py-8">No sessions yet. Add one below or use the Full Schedule Editor.</p>
    </div>
  </div>

  <div v-else-if="loading" class="flex items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
  </div>

  <!-- Clone modal -->
  <AppModal v-model="cloneDialog" title="Clone This Event" size="md">
    <div class="space-y-4">
      <p class="text-sm text-gray-500">Creates a new draft event copying ticket types, categories, days, and schedule.</p>
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">New Title</label>
          <input v-model="cloneForm.title" class="input text-sm" :placeholder="event?.title" />
        </div>
        <div>
          <label class="label">Edition Code</label>
          <input v-model="cloneForm.edition" class="input text-sm" placeholder="MYS4" />
        </div>
        <div>
          <label class="label">Day Offset</label>
          <input v-model.number="cloneForm.shift_days" type="number" class="input text-sm" placeholder="365" />
          <p class="text-xs text-gray-400 mt-1">Shift all dates by N days</p>
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
        <button class="btn-ghost text-xs" @click="cloneDialog=false">Cancel</button>
      </div>
    </div>
  </AppModal>

  <!-- Speaker modal -->
  <AppModal v-model="speakerModal" title="Add Speaker" size="md">
    <form class="space-y-4" @submit.prevent="addSpeaker">
      <div><label class="label">Name *</label><input v-model="spk.name" class="input" placeholder="Sheikh / Dr. / Ust. …" /></div>
      <div><label class="label">Title / Position</label><input v-model="spk.title" class="input" placeholder="Islamic Scholar, CEO…" /></div>
      <div><label class="label">Bio</label><textarea v-model="spk.bio" class="input" rows="3"></textarea></div>
      <div><label class="label">Photo URL</label><input v-model="spk.photo_url" class="input" placeholder="https://..." /></div>
      <div class="flex gap-2 pt-2">
        <button type="submit" :disabled="saving" class="btn-green text-xs">Save Speaker</button>
        <button type="button" class="btn-ghost text-xs" @click="speakerModal=false">Cancel</button>
      </div>
    </form>
  </AppModal>

  <!-- Quick add lecture modal -->
  <AppModal v-model="lectureModal" title="Quick Add Session" size="lg">
    <form class="space-y-4" @submit.prevent="addLecture">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="col-span-2 md:col-span-1">
          <label class="label">S/N</label>
          <input v-model.number="lec.s_n" type="number" min="1" class="input text-sm" placeholder="Auto" />
        </div>
        <div class="col-span-2 md:col-span-1">
          <label class="label">Day</label>
          <select v-model="lec.event_day_id" class="input text-sm">
            <option value="">All / General</option>
            <option v-for="d in eventDays" :key="d.id" :value="d.id">Day {{ d.day_number }} – {{ fmt(d.event_date) }}</option>
          </select>
        </div>
        <div>
          <label class="label">Start Time</label>
          <input v-model="lec.start_time" type="time" class="input text-sm" />
        </div>
        <div>
          <label class="label">End Time</label>
          <input v-model="lec.end_time" type="time" class="input text-sm" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="label">Title *</label>
          <input v-model="lec.title" class="input" placeholder="Lecture or session title…" />
        </div>
        <div>
          <label class="label">Type</label>
          <select v-model="lec.lecture_type" class="input text-sm">
            <option v-for="t in ['lecture','keynote','panel','workshop','prayer','break','other']" :key="t" :value="t" class="capitalize">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="label">Lecturer / Main Speaker</label>
          <input v-model="lec.main_speaker_name" class="input" placeholder="Sheikh / Dr. …" />
        </div>
        <div class="md:col-span-2">
          <label class="label">Facilitators</label>
          <input v-model="lec.facilitators" class="input" placeholder="Name 1, Name 2…" />
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <button type="submit" :disabled="saving" class="btn-green text-xs">Add to Schedule</button>
        <button type="button" class="btn-ghost text-xs" @click="lectureModal=false">Cancel</button>
        <RouterLink :to="`/admin/events/${id}/schedule`" class="ml-auto text-xs text-brand-green underline">Open Full Editor →</RouterLink>
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

const route   = useRoute();
const router  = useRouter();
const alert   = useAlertStore();
const id      = route.params.id;

const event       = ref(null);
const ticketTypes = ref([]);
const speakers    = ref([]);
const lectures    = ref([]);
const eventDays   = ref([]);
const loading     = ref(true);
const saving      = ref(false);
const cloning     = ref(false);
const activeTab   = ref('overview');
const speakerModal = ref(false);
const lectureModal = ref(false);
const cloneDialog  = ref(false);

const tabs = [
  { id:'overview',  label:'Overview'  },
  { id:'speakers',  label:'Speakers'  },
  { id:'schedule',  label:'Schedule'  },
];

const spk = reactive({ name:'', title:'', bio:'', photo_url:'' });
const lec = reactive({ s_n:'', event_day_id:'', start_time:'', end_time:'', title:'', lecture_type:'lecture', main_speaker_name:'', facilitators:'', description:'' });
const cloneForm = reactive({ title:'', edition:'', shift_days:365, start_date:'', end_date:'' });

const load = async () => {
  loading.value = true;
  try {
    const [evRes, ttRes, spRes, lcRes, dyRes] = await Promise.all([
      api.get(`/events/${id}`),
      api.get(`/events/${id}/ticket-types`),
      api.get(`/events/${id}/speakers`),
      api.get(`/events/${id}/schedule`),
      api.get(`/events/${id}/days`),
    ]);
    event.value       = evRes.data.data;
    ticketTypes.value = ttRes.data.data || [];
    speakers.value    = spRes.data.data || [];
    lectures.value    = lcRes.data.data || [];
    eventDays.value   = dyRes.data.data || [];
  } catch { alert.error('Failed to load event.'); }
  finally   { loading.value = false; }
};

onMounted(load);

const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';
const fmtP  = (n) => Number(n||0).toLocaleString('en-NG');

const statusClass = (s) => ({
  draft:'bg-gray-100 text-gray-600', active:'bg-green-100 text-green-700',
  completed:'bg-blue-100 text-blue-700', archived:'bg-red-50 text-red-400',
}[s] ?? '');

const setStatus = async (status) => {
  if (!confirm(`Change status to "${status}"?`)) return;
  try { await api.patch(`/events/${id}/status`, { status }); alert.success('Status updated.'); load(); }
  catch (err) { alert.error(err.response?.data?.message || 'Failed.'); }
};

const addSpeaker = async () => {
  if (!spk.name.trim()) return;
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
  if (!lec.title.trim()) { alert.error('Title is required.'); return; }
  saving.value = true;
  try {
    await api.post(`/events/${id}/lectures`, { ...lec, event_day_id: lec.event_day_id||null });
    alert.success('Session added.'); lectureModal.value = false;
    Object.assign(lec, { s_n:'', event_day_id:'', start_time:'', end_time:'', title:'', lecture_type:'lecture', main_speaker_name:'', facilitators:'', description:'' });
    load();
  } catch { alert.error('Failed to add session.'); }
  finally { saving.value = false; }
};

const doClone = async () => {
  cloning.value = true;
  try {
    const { data } = await api.post('/events/clone', { sourceEventId: id, ...cloneForm, shift_days: cloneForm.shift_days||0 });
    alert.success('Event cloned! Redirecting…');
    cloneDialog.value = false;
    setTimeout(() => router.push(`/admin/events/${data.data.id}`), 900);
  } catch (err) { alert.error(err.response?.data?.message || 'Clone failed.'); }
  finally { cloning.value = false; }
};
</script>
