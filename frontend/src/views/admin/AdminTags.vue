<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h2 class="font-display font-bold text-xl text-brand-green">Event Tags</h2>
      <div class="flex gap-2 items-center">
        <select v-model="selectedEvent" class="input text-sm w-48" @change="load">
          <option value="">Select event…</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.title }}</option>
        </select>
        <button :disabled="!selectedEvent" class="btn-green text-xs" @click="generateModal = true">Generate Tags</button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4" v-if="selectedEvent">
      <StatsWidget label="Total Tags"    :value="tagStats.total    ?? 0" icon="🏷" />
      <StatsWidget label="Assigned"      :value="tagStats.assigned ?? 0" icon="✅" />
      <StatsWidget label="Available"     :value="tagStats.available?? 0" icon="⬜" />
    </div>

    <DataTable v-if="selectedEvent" :columns="cols" :rows="tags" :loading="loading"
      empty-message="No tags generated for this event.">
      <template #cell-tag_number="{ row }">
        <span class="font-mono font-bold text-brand-green">{{ row.tag_number }}</span>
      </template>
      <template #cell-ticket="{ row }">
        <span v-if="row.ticket_unique_number" class="font-mono text-sm">{{ row.ticket_unique_number }}</span>
        <span v-else class="text-gray-300">Unassigned</span>
      </template>
      <template #cell-participant="{ row }">{{ row.participant_name || '—' }}</template>
      <template #cell-assigned_at="{ row }">{{ row.assigned_at ? fmt(row.assigned_at) : '—' }}</template>
      <template #actions="{ row }">
        <button v-if="!row.is_printed && row.ticket_id"
          class="text-xs text-brand-green underline hover:no-underline font-semibold"
          @click="printTag(row)">Print</button>
      </template>
    </DataTable>
  </div>

  <!-- Generate modal -->
  <AppModal v-model="generateModal" title="Generate Tags" size="sm">
    <div class="space-y-4">
      <div>
        <label class="label">Number of tags</label>
        <input v-model.number="genCount" type="number" min="1" max="2000" class="input" placeholder="100" />
        <p class="text-xs text-gray-400 mt-1">Tags will be sequentially numbered (e.g. TAG-001)</p>
      </div>
      <div class="flex gap-2">
        <button :disabled="generating" class="btn-green text-xs" @click="doGenerate">
          {{ generating ? 'Generating…' : 'Generate' }}
        </button>
        <button class="btn-ghost text-xs" @click="generateModal = false">Cancel</button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import DataTable   from '@/components/admin/DataTable.vue';
import StatsWidget from '@/components/admin/StatsWidget.vue';
import AppModal    from '@/components/common/AppModal.vue';
import { useAlertStore } from '@/stores/alertStore.js';
import api from '@/composables/useApi.js';

const alert        = useAlertStore();
const events       = ref([]);
const tags         = ref([]);
const tagStats     = ref({});
const loading      = ref(false);
const generating   = ref(false);
const selectedEvent = ref('');
const generateModal = ref(false);
const genCount     = ref(100);

const cols = [
  { key:'tag_number',   label:'Tag No.'      },
  { key:'ticket',       label:'Ticket'       },
  { key:'participant',  label:'Participant'  },
  { key:'assigned_at',  label:'Assigned'     },
];

onMounted(async () => {
  const { data } = await api.get('/events');
  events.value = data.data || [];
});

const load = async () => {
  if (!selectedEvent.value) { tags.value = []; return; }
  loading.value = true;
  try {
    const { data } = await api.get(`/tags/${selectedEvent.value}`);
    tags.value     = data.data?.tags  || [];
    tagStats.value = data.data?.stats || {};
  } catch { alert.error('Failed to load tags.'); }
  finally { loading.value = false; }
};

const doGenerate = async () => {
  generating.value = true;
  try {
    await api.post(`/tags/${selectedEvent.value}/generate`, { count: genCount.value });
    alert.success(`${genCount.value} tags generated!`); generateModal.value = false; load();
  } catch (err) { alert.error(err.response?.data?.message || 'Generation failed.'); }
  finally { generating.value = false; }
};

const printTag = async (tag) => {
  // Open print window with tag QR
  const win = window.open('', '_blank', 'width=400,height=300');
  win.document.write(`<html><body style="font-family:sans-serif;text-align:center;padding:20px">
    <h2>MYS Event Tag</h2>
    <h1 style="font-size:2em;letter-spacing:.1em">${tag.tag_number}</h1>
    ${tag.qr_code_svg || ''}
    <p>${tag.participant_name || ''}</p>
    <script>window.print();window.close();<\/script>
  </body></html>`);
  try { await api.patch(`/tags/${tag.id}/printed`); load(); } catch {}
};

const fmt = (d) => d ? new Date(d).toLocaleString('en-NG',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
</script>
