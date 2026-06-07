<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="font-display font-bold text-xl text-brand-green">Email Campaigns</h2>
      <button class="btn-green text-xs" @click="createModal = true">+ New Campaign</button>
    </div>

    <DataTable :columns="cols" :rows="campaigns" :loading="loading" empty-message="No campaigns yet.">
      <template #cell-subject="{ row }">
        <p class="font-semibold text-sm">{{ row.subject }}</p>
        <p class="text-xs text-gray-400">{{ row.recipient_type === 'past_attendees' ? 'Past attendees' : 'All subscribers' }}</p>
      </template>
      <template #cell-status="{ row }">
        <span class="badge text-xs" :class="statusClass(row.status)">{{ row.status }}</span>
      </template>
      <template #cell-sent_count="{ row }">
        {{ row.status === 'sent' ? `${row.sent_count} / ${row.recipient_count}` : '—' }}
      </template>
      <template #cell-created_at="{ row }">{{ fmt(row.created_at) }}</template>
      <template #actions="{ row }">
        <button v-if="row.status === 'draft'"
          class="text-xs btn-green py-1 px-3"
          :disabled="sending === row.id"
          @click="sendCampaign(row.id)">
          {{ sending === row.id ? 'Sending…' : 'Send' }}
        </button>
      </template>
    </DataTable>
  </div>

  <!-- Create campaign modal -->
  <AppModal v-model="createModal" title="New Email Campaign" size="lg">
    <form class="space-y-4" @submit.prevent="saveCampaign">
      <div>
        <label class="label">Subject *</label>
        <input v-model="form.subject" class="input" placeholder="Exciting news about MYS 3.0!" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Recipients</label>
          <select v-model="form.recipient_type" class="input">
            <option value="all">All subscribers</option>
            <option value="past_attendees">Past attendees only</option>
          </select>
        </div>
        <div>
          <label class="label">Related Event</label>
          <select v-model="form.event_id" class="input">
            <option value="">None</option>
            <option v-for="e in events" :key="e.id" :value="e.id">{{ e.title }}</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label">Email Body (HTML) *</label>
        <textarea v-model="form.body_html" class="input font-mono text-xs" rows="10"
          placeholder="<h1>Assalamu Alaikum!</h1><p>We're excited to announce...</p>"></textarea>
        <p class="text-xs text-gray-400 mt-1">You can use HTML. Use <code class="bg-gray-100 px-1">{{ '{{name}}' }}</code> for recipient name.</p>
      </div>
      <div class="flex gap-2 pt-2">
        <button type="submit" :disabled="saving" class="btn-green text-xs">Create Draft</button>
        <button type="button" class="btn-ghost text-xs" @click="createModal = false">Cancel</button>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import DataTable from '@/components/admin/DataTable.vue';
import AppModal  from '@/components/common/AppModal.vue';
import { useAlertStore } from '@/stores/alertStore.js';
import api from '@/composables/useApi.js';

const alert     = useAlertStore();
const campaigns = ref([]);
const events    = ref([]);
const loading   = ref(false);
const saving    = ref(false);
const sending   = ref(null);
const createModal = ref(false);

const form = reactive({ subject:'', body_html:'', recipient_type:'all', event_id:'' });

const cols = [
  { key:'subject',     label:'Campaign'   },
  { key:'status',      label:'Status'     },
  { key:'sent_count',  label:'Sent'       },
  { key:'created_at',  label:'Created'    },
];

const load = async () => {
  loading.value = true;
  try {
    const [cRes, eRes] = await Promise.all([
      api.get('/email/campaigns'),
      api.get('/events'),
    ]);
    campaigns.value = cRes.data.data || [];
    events.value    = eRes.data.data || [];
  } catch { alert.error('Failed to load campaigns.'); }
  finally { loading.value = false; }
};

onMounted(load);

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';

const statusClass = (s) => ({
  draft:   'bg-gray-100 text-gray-600',
  sending: 'bg-yellow-100 text-yellow-700',
  sent:    'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-600',
}[s] ?? '');

const saveCampaign = async () => {
  if (!form.subject || !form.body_html) { alert.error('Subject and body are required.'); return; }
  saving.value = true;
  try {
    await api.post('/email/campaigns', { ...form, event_id: form.event_id || null });
    alert.success('Campaign draft created.'); createModal.value = false;
    Object.assign(form, { subject:'', body_html:'', recipient_type:'all', event_id:'' });
    load();
  } catch { alert.error('Failed to create campaign.'); }
  finally { saving.value = false; }
};

const sendCampaign = async (id) => {
  if (!confirm('Send this campaign now? This cannot be undone.')) return;
  sending.value = id;
  try {
    await api.post(`/email/campaigns/${id}/send`);
    alert.success('Campaign is being sent!'); load();
  } catch (err) {
    alert.error(err.response?.data?.message || 'Send failed.');
  } finally { sending.value = null; }
};
</script>
