<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="font-display font-bold text-xl text-brand-green">Sponsors</h2>
        <p class="text-sm text-gray-500">Manage event sponsors — displayed on the landing page</p>
      </div>
      <button class="btn-green text-xs" @click="openCreate"><Plus :size="14" /> Add Sponsor</button>
    </div>

    <!-- Filter bar -->
    <div class="bg-white border border-gray-100 p-4 flex gap-3 flex-wrap items-center">
      <div class="relative flex-1 min-w-[180px]">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input pl-8 text-sm" placeholder="Search sponsors…" />
      </div>
      <select v-model="tierFilter" class="input text-sm w-36">
        <option value="">All tiers</option>
        <option v-for="t in TIERS" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>

    <!-- DataTable -->
    <div class="bg-white border border-gray-100 overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16">
        <Loader :size="26" class="animate-spin text-brand-green/40" />
      </div>
      <div v-else-if="filteredRows.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-brand-green text-white">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Sponsor</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tier</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">Event</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sp in filteredRows" :key="sp.id"
              class="border-b border-gray-50 hover:bg-brand-cream/20">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-10 border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img v-if="sp.logo_url" :src="sp.logo_url" :alt="sp.name"
                      class="max-w-full max-h-full object-contain" />
                    <Star v-else :size="18" class="text-gray-300" />
                  </div>
                  <div>
                    <p class="font-semibold text-gray-800">{{ sp.name }}</p>
                    <a v-if="sp.website_url" :href="sp.website_url" target="_blank"
                      class="text-xs text-brand-green hover:underline flex items-center gap-1">
                      <ExternalLink :size="9" /> {{ sp.website_url.replace(/https?:\/\//,'').slice(0,30) }}
                    </a>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="badge text-xs font-bold px-2.5 py-1" :class="tierClass(sp.tier)">
                  {{ tierLabel(sp.tier) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                {{ sp.event_title ? `[${sp.edition}] ${sp.event_title}` : 'All Events' }}
              </td>
              <td class="px-4 py-3">
                <span class="badge text-xs" :class="sp.is_active ? 'badge-green' : 'bg-gray-100 text-gray-400'">
                  {{ sp.is_active ? 'Active' : 'Hidden' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex gap-2 justify-end">
                  <button class="text-brand-green hover:opacity-70" @click="openEdit(sp)"><Pencil :size="14" /></button>
                  <button class="text-gray-400 hover:text-red-400" @click="promptDelete(sp)"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="py-16 text-center text-gray-300">
        <Star :size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-sm">No sponsors yet.</p>
      </div>
      <div class="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        {{ filteredRows.length }} of {{ sponsors.length }} sponsors
      </div>
    </div>
  </div>

  <!-- Create/Edit Modal -->
  <AppModal v-model="modal" :title="editing ? 'Edit Sponsor' : 'Add Sponsor'" size="lg">
    <form @submit.prevent="save" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="label">Sponsor Name <span class="text-red-500">*</span></label>
          <input v-model="form.name" class="input" :class="{'input-error':errs.name}"
            placeholder="Company or organization name" />
          <p v-if="errs.name" class="text-red-500 text-xs mt-1">{{ errs.name }}</p>
        </div>
        <div>
          <label class="label">Sponsorship Tier</label>
          <select v-model="form.tier" class="input">
            <option v-for="t in TIERS" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Related Event</label>
          <select v-model="form.event_id" class="input">
            <option :value="null">All Events / General</option>
            <option v-for="e in events" :key="e.id" :value="e.id">
              {{ e.edition ? `[${e.edition}] ${e.title}` : e.title }}
            </option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="label">Logo URL</label>
          <input v-model="form.logo_url" class="input" placeholder="https://… (company logo image)" />
          <div v-if="form.logo_url" class="mt-2 h-12 border border-gray-100 bg-gray-50 inline-flex items-center justify-center px-4">
            <img :src="form.logo_url" class="max-h-10 object-contain" alt="logo preview" />
          </div>
        </div>
        <div class="md:col-span-2">
          <label class="label">Website URL</label>
          <input v-model="form.website_url" class="input" placeholder="https://company.com" />
        </div>
        <div class="md:col-span-2">
          <label class="label">Description / Note</label>
          <textarea v-model="form.description" class="input text-sm" rows="2"
            placeholder="Short note about this sponsorship (optional)" />
        </div>
        <div class="grid grid-cols-2 gap-4 md:col-span-2">
          <div>
            <label class="label">Sort Order</label>
            <input v-model.number="form.sort_order" type="number" min="0" class="input" />
          </div>
          <div>
            <label class="label">Visibility</label>
            <select v-model="form.is_active" class="input">
              <option :value="1">Visible</option>
              <option :value="0">Hidden</option>
            </select>
          </div>
        </div>
      </div>
      <div class="flex gap-2 pt-3 border-t border-gray-100">
        <button type="submit" :disabled="saving" class="btn-green text-xs flex items-center gap-2">
          <component :is="saving ? Loader : Save" :size="14" :class="saving?'animate-spin':''" />
          {{ saving ? 'Saving…' : (editing ? 'Update' : 'Add Sponsor') }}
        </button>
        <button type="button" class="btn-ghost text-xs" @click="modal=false">Cancel</button>
      </div>
    </form>
  </AppModal>

  <ConfirmModal v-model="deleteModal" title="Remove Sponsor"
    :message="`Remove '${deleting?.name}'?`" type="danger"
    confirm-label="Remove" :loading="deleteBusy" @confirm="doDelete" />
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, Loader, Save, Pencil, Trash2, Search, Star, ExternalLink } from 'lucide-vue-next';
import AppModal    from '@/components/common/AppModal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { useAlertStore } from '@/stores/alertStore.js';
import api from '@/composables/useApi.js';

const alert    = useAlertStore();
const sponsors = ref([]);
const events   = ref([]);
const loading  = ref(false);
const saving   = ref(false);
const deleteBusy = ref(false);
const modal    = ref(false);
const deleteModal = ref(false);
const editing  = ref(null);
const deleting = ref(null);
const search   = ref('');
const tierFilter = ref('');

const TIERS = [
  { value:'title',   label:'Title Sponsor' },
  { value:'gold',    label:'Gold' },
  { value:'silver',  label:'Silver' },
  { value:'bronze',  label:'Bronze' },
  { value:'media',   label:'Media Partner' },
  { value:'partner', label:'Partner' },
];

const form = reactive({ event_id:null, name:'', logo_url:'', website_url:'', tier:'gold', description:'', sort_order:0, is_active:1 });
const errs = reactive({ name:'' });

const filteredRows = computed(() => {
  let rows = sponsors.value;
  if (search.value) { const q = search.value.toLowerCase(); rows = rows.filter(s => s.name.toLowerCase().includes(q)); }
  if (tierFilter.value) rows = rows.filter(s => s.tier === tierFilter.value);
  return rows;
});

const tierLabel = (t) => TIERS.find(x => x.value === t)?.label || t;
const tierClass = (t) => ({
  title:   'bg-yellow-100 text-yellow-800 border border-yellow-300',
  gold:    'bg-brand-cream text-brand-green border border-brand-gold',
  silver:  'bg-gray-100 text-gray-600 border border-gray-300',
  bronze:  'bg-orange-100 text-orange-700 border border-orange-300',
  media:   'bg-brand-green/10 text-brand-green border border-brand-green/30',
  partner: 'bg-blue-50 text-blue-700 border border-blue-200',
}[t] ?? '');

onMounted(async () => {
  loading.value = true;
  try {
    const [spRes, evRes] = await Promise.all([api.get('/sponsors/all'), api.get('/events')]);
    sponsors.value = spRes.data.data || [];
    events.value   = evRes.data.data || [];
  } catch { alert.error('Failed to load sponsors.'); }
  finally { loading.value = false; }
});

const resetForm = () => { Object.assign(form, { event_id:null, name:'', logo_url:'', website_url:'', tier:'gold', description:'', sort_order:sponsors.value.length, is_active:1 }); errs.name=''; editing.value=null; };
const openCreate = () => { resetForm(); modal.value=true; };
const openEdit   = (sp) => { editing.value=sp.id; Object.assign(form, { event_id:sp.event_id||null, name:sp.name, logo_url:sp.logo_url||'', website_url:sp.website_url||'', tier:sp.tier, description:sp.description||'', sort_order:sp.sort_order, is_active:sp.is_active }); modal.value=true; };
const promptDelete = (sp) => { deleting.value=sp; deleteModal.value=true; };

const save = async () => {
  errs.name = form.name.trim() ? '' : 'Name is required.';
  if (errs.name) return;
  saving.value = true;
  try {
    if (editing.value) { await api.put(`/sponsors/${editing.value}`, form); alert.success('Updated.'); }
    else               { await api.post('/sponsors', form);                alert.success('Sponsor added!'); }
    modal.value = false;
    const { data } = await api.get('/sponsors/all'); sponsors.value = data.data || [];
  } catch (e) { alert.error(e.response?.data?.message || 'Save failed.'); }
  finally { saving.value = false; }
};

const doDelete = async () => {
  deleteBusy.value = true;
  try { await api.delete(`/sponsors/${deleting.value.id}`); alert.success('Removed.'); deleteModal.value=false; const { data } = await api.get('/sponsors/all'); sponsors.value = data.data || []; }
  catch (e) { alert.error(e.response?.data?.message || 'Delete failed.'); }
  finally { deleteBusy.value=false; }
};
</script>
