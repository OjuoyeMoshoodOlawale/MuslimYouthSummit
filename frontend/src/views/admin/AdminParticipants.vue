<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h2 class="font-display font-bold text-xl text-brand-green">Participants</h2>
      <div class="flex gap-2">
        <input v-model="search" class="input text-sm w-48" placeholder="Search name / email…" @input="doSearch" />
      </div>
    </div>

    <DataTable :columns="cols" :rows="rows" :loading="loading" :pagination="pagination"
      empty-message="No participants found." @page="changePage">
      <template #cell-name="{ row }">
        <div>
          <p class="font-semibold text-sm">{{ row.name }}</p>
          <p class="text-xs text-gray-400">{{ row.email }}</p>
        </div>
      </template>
      <template #cell-phone="{ row }">{{ row.phone || '—' }}</template>
      <template #cell-email_subscribed="{ row }">
        <span class="badge text-xs" :class="row.email_subscribed ? 'badge-green' : 'bg-gray-100 text-gray-500'">
          {{ row.email_subscribed ? 'Subscribed' : 'Unsub' }}
        </span>
      </template>
      <template #cell-created_at="{ row }">{{ fmt(row.created_at) }}</template>
      <template #actions="{ row }">
        <button v-if="row.email_subscribed"
          class="text-xs text-gray-400 hover:text-red-500 font-semibold"
          @click="unsubscribe(row.id)">Unsubscribe</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DataTable from '@/components/admin/DataTable.vue';
import { useAlertStore } from '@/stores/alertStore.js';
import api from '@/composables/useApi.js';

const alert      = useAlertStore();
const rows       = ref([]);
const loading    = ref(false);
const search     = ref('');
const pagination = ref(null);
const page       = ref(1);

const cols = [
  { key:'name',             label:'Participant' },
  { key:'phone',            label:'Phone'       },
  { key:'email_subscribed', label:'Email'       },
  { key:'created_at',       label:'Joined'      },
];

const load = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/participants', { params: { page: page.value, search: search.value } });
    rows.value       = data.data        || [];
    pagination.value = data.pagination  || null;
  } catch { alert.error('Failed to load participants.'); }
  finally { loading.value = false; }
};

onMounted(load);

let searchTimeout;
const doSearch = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value=1; load(); }, 350); };
const changePage = (p) => { page.value = p; load(); };
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';

const unsubscribe = async (id) => {
  if (!confirm('Unsubscribe this participant from emails?')) return;
  try { await api.delete(`/participants/${id}/unsubscribe`); alert.success('Unsubscribed.'); load(); }
  catch { alert.error('Failed.'); }
};
</script>
