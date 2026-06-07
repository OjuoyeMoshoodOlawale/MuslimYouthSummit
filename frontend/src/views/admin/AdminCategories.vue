<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="font-display font-bold text-xl text-brand-green">Event Categories</h2>
        <p class="text-sm text-gray-500">Divisions / class groups — assigned at registration</p>
      </div>
      <div class="flex gap-2 items-center">
        <select v-model="selectedEvent" class="input text-sm w-52" @change="load">
          <option value="">Select event…</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.title }}</option>
        </select>
        <button :disabled="!selectedEvent" class="btn-green text-xs" @click="openCreate">
          + Add Category
        </button>
      </div>
    </div>

    <!-- Stats row -->
    <div v-if="selectedEvent && categories.length" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="c in categories" :key="c.id"
        class="bg-white border border-gray-100 p-4 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full" :style="{ backgroundColor: c.color }"></div>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 pl-3">{{ c.name }}</p>
        <p class="font-display font-bold text-3xl text-brand-green pl-3">{{ c.registered_count ?? 0 }}</p>
        <p class="text-xs text-gray-400 mt-1 pl-3">
          {{ c.capacity ? `of ${c.capacity}` : 'unlimited' }}
        </p>
      </div>
    </div>

    <!-- Table -->
    <div v-if="selectedEvent" class="bg-white border border-gray-100">
      <div class="overflow-x-auto">
        <table class="w-full text-sm" v-if="categories.length">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-8">#</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Category</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Registered</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Capacity</th>
              <th class="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th class="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in categories" :key="c.id"
              class="border-b border-gray-50 hover:bg-brand-cream/30">
              <td class="px-5 py-3 text-gray-400 font-mono text-xs">{{ i+1 }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: c.color }"></span>
                  <div>
                    <p class="font-semibold text-gray-800">{{ c.name }}</p>
                    <p v-if="c.description" class="text-xs text-gray-400">{{ c.description }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3 font-bold text-brand-green">{{ c.registered_count ?? 0 }}</td>
              <td class="px-5 py-3 text-gray-500">{{ c.capacity ?? 'Unlimited' }}</td>
              <td class="px-5 py-3">
                <span class="badge text-xs" :class="c.is_active ? 'badge-green' : 'bg-gray-100 text-gray-400'">
                  {{ c.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex gap-2 justify-end">
                  <button class="text-xs text-brand-green underline font-semibold" @click="openEdit(c)">Edit</button>
                  <button class="text-xs text-red-400 hover:text-red-600 font-semibold" @click="remove(c)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 text-center text-gray-400 text-sm">
          No categories yet. Create divisions/classes for this event.
        </div>
      </div>
    </div>
    <div v-else class="text-center py-12 text-gray-300 text-sm">Select an event above.</div>
  </div>

  <AppModal v-model="modal" :title="editing ? 'Edit Category' : 'New Category'" size="md">
    <form @submit.prevent="save" class="space-y-4" novalidate>
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" placeholder="Youth / Professionals / Brother A…" />
        <p v-if="errs.name" class="text-red-500 text-xs mt-1">{{ errs.name }}</p>
      </div>
      <div>
        <label class="label">Description</label>
        <input v-model="form.description" class="input" placeholder="Short description (optional)" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Badge Colour</label>
          <div class="flex items-center gap-3">
            <input v-model="form.color" type="color" class="w-12 h-10 border border-gray-200 cursor-pointer rounded" />
            <input v-model="form.color" class="input text-sm font-mono" placeholder="#02462E" />
          </div>
        </div>
        <div>
          <label class="label">Capacity</label>
          <input v-model.number="form.capacity" type="number" min="1" class="input" placeholder="Unlimited" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Sort Order</label>
          <input v-model.number="form.sort_order" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="label">Active</label>
          <select v-model="form.is_active" class="input">
            <option :value="1">Yes</option>
            <option :value="0">No</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 pt-2 border-t border-gray-100">
        <button type="submit" :disabled="saving" class="btn-green text-xs">
          {{ saving ? 'Saving…' : (editing ? 'Update' : 'Create') }}
        </button>
        <button type="button" class="btn-ghost text-xs" @click="modal = false">Cancel</button>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import { useAlertStore } from '@/stores/alertStore.js';
import api from '@/composables/useApi.js';

const alert         = useAlertStore();
const events        = ref([]);
const categories    = ref([]);
const selectedEvent = ref('');
const saving        = ref(false);
const modal         = ref(false);
const editing       = ref(null);

const form = reactive({ name:'', description:'', color:'#02462E', capacity:'', sort_order:0, is_active:1 });
const errs = reactive({ name:'' });

onMounted(async () => {
  const { data } = await api.get('/events');
  events.value = data.data || [];
  // auto-select active event
  const active = events.value.find(e => e.status === 'active');
  if (active) { selectedEvent.value = active.id; load(); }
});

const load = async () => {
  if (!selectedEvent.value) { categories.value = []; return; }
  try {
    const { data } = await api.get(`/events/${selectedEvent.value}/categories`);
    categories.value = data.data || [];
  } catch { alert.error('Failed to load categories.'); }
};

const resetForm = () => {
  Object.assign(form, { name:'', description:'', color:'#02462E', capacity:'', sort_order:0, is_active:1 });
  errs.name = '';
};

const openCreate = () => { editing.value = null; resetForm(); modal.value = true; };
const openEdit   = (c) => {
  editing.value = c.id;
  Object.assign(form, { name:c.name, description:c.description||'', color:c.color,
    capacity:c.capacity||'', sort_order:c.sort_order, is_active:c.is_active });
  errs.name = '';
  modal.value = true;
};

const save = async () => {
  errs.name = form.name.trim() ? '' : 'Name is required.';
  if (errs.name) return;
  saving.value = true;
  try {
    const payload = { ...form, capacity: form.capacity || null };
    if (editing.value) {
      await api.put(`/categories/${editing.value}`, payload);
      alert.success('Category updated.');
    } else {
      await api.post(`/events/${selectedEvent.value}/categories`, payload);
      alert.success('Category created.');
    }
    modal.value = false; load();
  } catch (err) { alert.error(err.response?.data?.message || 'Failed.'); }
  finally { saving.value = false; }
};

const remove = async (c) => {
  if (!confirm(`Delete category "${c.name}"?`)) return;
  try {
    await api.delete(`/categories/${c.id}`);
    alert.success('Category deleted.'); load();
  } catch (err) { alert.error(err.response?.data?.message || 'Delete failed.'); }
};
</script>
