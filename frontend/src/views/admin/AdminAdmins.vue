<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="font-display font-bold text-xl text-brand-green">Admin Accounts</h2>
      <button class="btn-green text-xs" @click="createModal = true">+ Add Admin</button>
    </div>

    <DataTable :columns="cols" :rows="admins" :loading="loading" empty-message="No admins found.">
      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs font-bold">{{ row.name?.[0] }}</span>
          </div>
          <div>
            <p class="font-semibold text-sm">{{ row.name }}</p>
            <p class="text-xs text-gray-400">{{ row.email }}</p>
          </div>
        </div>
      </template>
      <template #cell-role="{ row }">
        <span class="badge text-xs" :class="roleClass(row.role)">{{ row.role.replace('_',' ') }}</span>
      </template>
      <template #cell-is_active="{ row }">
        <span class="badge text-xs" :class="row.is_active ? 'badge-green' : 'bg-red-50 text-red-400'">
          {{ row.is_active ? 'Active' : 'Inactive' }}
        </span>
      </template>
      <template #cell-created_at="{ row }">{{ fmt(row.created_at) }}</template>
      <template #actions="{ row }">
        <div class="flex gap-2">
          <button class="text-xs text-brand-green underline font-semibold"
            @click="toggleActive(row)">{{ row.is_active ? 'Deactivate' : 'Activate' }}</button>
        </div>
      </template>
    </DataTable>
  </div>

  <AppModal v-model="createModal" title="Add Admin" size="md">
    <form class="space-y-4" @submit.prevent="save">
      <div><label class="label">Full Name *</label><input v-model="form.name" class="input" /></div>
      <div><label class="label">Email *</label><input v-model="form.email" type="email" class="input" /></div>
      <div>
        <label class="label">Role *</label>
        <select v-model="form.role" class="input">
          <option value="admin">Admin</option>
          <option value="attendant">Attendant</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      <div><label class="label">Password *</label><input v-model="form.password" type="password" class="input" placeholder="Min 8 characters" /></div>
      <div class="flex gap-2 pt-2">
        <button type="submit" :disabled="saving" class="btn-green text-xs">Create Admin</button>
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

const alert  = useAlertStore();
const admins  = ref([]);
const loading = ref(false);
const saving  = ref(false);
const createModal = ref(false);
const form = reactive({ name:'', email:'', role:'admin', password:'' });

const cols = [
  { key:'name',       label:'Admin'   },
  { key:'role',       label:'Role'    },
  { key:'is_active',  label:'Status'  },
  { key:'created_at', label:'Created' },
];

const load = async () => {
  loading.value = true;
  try { const { data } = await api.get('/auth/admins'); admins.value = data.data || []; }
  catch { alert.error('Failed to load admins.'); }
  finally { loading.value = false; }
};

onMounted(load);

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';
const roleClass = (r) => ({
  super_admin: 'badge-gold',
  admin:       'badge-green',
  attendant:   'badge-light',
}[r] ?? '');

const save = async () => {
  saving.value = true;
  try {
    await api.post('/auth/admins', form);
    alert.success('Admin created.'); createModal.value = false;
    Object.assign(form, { name:'', email:'', role:'admin', password:'' });
    load();
  } catch (err) { alert.error(err.response?.data?.message || 'Failed.'); }
  finally { saving.value = false; }
};

const toggleActive = async (row) => {
  try {
    await api.patch(`/auth/admins/${row.id}/status`, { is_active: !row.is_active });
    alert.success(`Admin ${row.is_active ? 'deactivated' : 'activated'}.`); load();
  } catch { alert.error('Failed.'); }
};
</script>
