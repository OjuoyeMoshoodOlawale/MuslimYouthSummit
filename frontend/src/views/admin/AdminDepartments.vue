<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="font-display font-bold text-xl text-brand-green">Departments</h2>
        <p class="text-sm text-gray-500">Create departments that can raise expense requests</p>
      </div>
      <button class="btn-green text-xs" @click="openCreate">
        <Plus :size="14" /> Add Department
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader :size="28" class="animate-spin text-brand-green/40" />
    </div>

    <div v-else-if="departments.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="d in departments" :key="d.id"
        class="bg-white border border-gray-100 hover:border-brand-green/30 transition-all p-5">
        <div class="flex items-start justify-between mb-3">
          <div class="w-11 h-11 bg-brand-cream flex items-center justify-center flex-shrink-0">
            <Building2 :size="20" class="text-brand-green" />
          </div>
          <span class="badge text-xs" :class="d.is_active ? 'badge-green' : 'bg-gray-100 text-gray-400'">
            {{ d.is_active ? 'Active' : 'Inactive' }}
          </span>
        </div>
        <h3 class="font-display font-bold text-brand-green text-lg">{{ d.name }}</h3>
        <p v-if="d.head_name" class="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <User :size="12" /> {{ d.head_name }}
        </p>
        <p v-if="d.description" class="text-xs text-gray-400 mt-2 line-clamp-2">{{ d.description }}</p>

        <div class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-50 text-center">
          <div>
            <p class="font-bold text-brand-green text-lg tabular-nums">{{ d.member_count || 0 }}</p>
            <p class="text-xs text-gray-400">Members</p>
          </div>
          <div>
            <p class="font-bold text-yellow-500 text-lg tabular-nums">{{ d.pending_count || 0 }}</p>
            <p class="text-xs text-gray-400">Pending</p>
          </div>
          <div>
            <p class="font-bold text-brand-green text-lg tabular-nums">
              ₦{{ fmtK(d.total_paid || 0) }}
            </p>
            <p class="text-xs text-gray-400">Paid out</p>
          </div>
        </div>

        <div class="flex gap-2 mt-4">
          <button class="btn-outline text-xs flex-1 py-1.5 justify-center" @click="openEdit(d)">
            <Pencil :size="11" /> Edit
          </button>
          <button class="px-3 py-1.5 border border-gray-200 text-gray-400 hover:text-red-400 transition-colors"
            @click="remove(d)"><Trash2 :size="13" /></button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-16 bg-white border border-dashed border-gray-200">
      <Building2 :size="40" class="mx-auto mb-3 text-gray-300" />
      <p class="text-sm text-gray-400">No departments yet.</p>
    </div>
  </div>

  <AppModal v-model="modal" :title="editing ? 'Edit Department' : 'Add Department'" size="md">
    <form @submit.prevent="save" class="space-y-4" novalidate>
      <div>
        <label class="label">Department Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" :class="{'input-error':errs.name}"
          placeholder="e.g. Kitchen, Gate, Transport, AV Team" />
        <p v-if="errs.name" class="text-red-500 text-xs mt-1">{{ errs.name }}</p>
      </div>
      <div>
        <label class="label">Head / Coordinator Name</label>
        <input v-model="form.head_name" class="input" placeholder="Name of the department head" />
      </div>
      <div>
        <label class="label">Description</label>
        <textarea v-model="form.description" class="input" rows="2"
          placeholder="What does this department handle?" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Sort Order</label>
          <input v-model.number="form.sort_order" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="label">Status</label>
          <select v-model="form.is_active" class="input">
            <option :value="1">Active</option>
            <option :value="0">Inactive</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 pt-3 border-t border-gray-100">
        <button type="submit" :disabled="saving" class="btn-green text-xs px-6 flex items-center gap-2">
          <component :is="saving ? Loader : Save" :size="14" :class="saving?'animate-spin':''" />
          {{ saving ? 'Saving…' : (editing ? 'Update' : 'Create') }}
        </button>
        <button type="button" class="btn-ghost text-xs" @click="modal=false">Cancel</button>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Loader, Save, Pencil, Trash2, Building2, User } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import { useAlertStore } from '@/stores/alertStore.js';
import api from '@/composables/useApi.js';

const alert       = useAlertStore();
const departments = ref([]);
const loading     = ref(false);
const saving      = ref(false);
const modal       = ref(false);
const editing     = ref(null);
const form = reactive({ name:'', description:'', head_name:'', sort_order:0, is_active:1 });
const errs = reactive({ name:'' });

const load = async () => {
  loading.value = true;
  try { const { data } = await api.get('/departments'); departments.value = data.data || []; }
  catch { alert.error('Failed to load departments.'); }
  finally { loading.value = false; }
};
onMounted(load);

const fmtK = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
const resetForm = () => { Object.assign(form, { name:'', description:'', head_name:'', sort_order:departments.value.length, is_active:1 }); errs.name=''; };
const openCreate = () => { editing.value=null; resetForm(); modal.value=true; };
const openEdit = (d) => { editing.value=d.id; Object.assign(form, { name:d.name, description:d.description||'', head_name:d.head_name||'', sort_order:d.sort_order, is_active:d.is_active }); modal.value=true; };
const save = async () => {
  errs.name = form.name.trim() ? '' : 'Department name is required.';
  if (errs.name) return;
  saving.value = true;
  try {
    if (editing.value) { await api.put(`/departments/${editing.value}`, form); alert.success('Updated.'); }
    else               { await api.post('/departments', form);               alert.success('Created.'); }
    modal.value=false; load();
  } catch (err) { alert.error(err.response?.data?.message || 'Failed.'); }
  finally { saving.value=false; }
};
const remove = async (d) => {
  if (!confirm(`Delete "${d.name}"?`)) return;
  try { await api.delete(`/departments/${d.id}`); alert.success('Deleted.'); load(); }
  catch (err) { alert.error(err.response?.data?.message || 'Delete failed.'); }
};
</script>
