<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="font-display font-bold text-xl text-brand-green">Gallery</h2>
      <div class="flex gap-3 items-center">
        <select v-model="selectedEvent" class="input text-sm w-48" @change="load">
          <option value="">Select event…</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.edition ? `[${e.edition}] ${e.title}` : e.title }}</option>
        </select>
        <button :disabled="!selectedEvent" class="btn-green text-xs" @click="uploadModal = true">+ Upload Photos</button>
      </div>
    </div>

    <div v-if="images.length" class="columns-2 md:columns-4 gap-3 space-y-3">
      <div v-for="img in images" :key="img.id" class="group relative break-inside-avoid overflow-hidden">
        <img :src="img.image_url" :alt="img.caption || ''" class="w-full object-cover" />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button class="bg-red-500 text-white text-xs px-3 py-1.5 font-semibold"
            @click="deleteImage(img.id)">Delete</button>
        </div>
        <p v-if="img.caption" class="text-xs text-gray-500 px-1 py-1.5">{{ img.caption }}</p>
      </div>
    </div>
    <div v-else-if="selectedEvent && !loading" class="text-center py-16 text-gray-400">
      <p class="text-4xl mb-3">🖼</p>
      <p class="text-sm">No images for this event yet. Upload some!</p>
    </div>
    <div v-else-if="!selectedEvent" class="text-center py-16 text-gray-300">
      <p class="text-sm">Select an event above to manage its gallery.</p>
    </div>
  </div>

  <!-- Upload modal -->
  <AppModal v-model="uploadModal" title="Upload Photos" size="lg">
    <div class="space-y-4">
      <div class="border-2 border-dashed border-gray-200 rounded p-8 text-center"
        @dragover.prevent @drop.prevent="handleDrop">
        <input type="file" id="img-input" multiple accept="image/*" class="hidden" @change="handleFiles" />
        <label for="img-input" class="cursor-pointer">
          <p class="text-4xl mb-2">📷</p>
          <p class="text-sm text-gray-500">Click to select or drag & drop images</p>
          <p class="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · Max 5MB each</p>
        </label>
      </div>

      <div v-if="filePreviews.length" class="grid grid-cols-3 gap-3">
        <div v-for="(fp, i) in filePreviews" :key="i" class="relative">
          <img :src="fp.preview" class="w-full h-24 object-cover" />
          <input v-model="fp.caption" class="input text-xs mt-1" placeholder="Caption (optional)" />
          <button class="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center"
            @click="filePreviews.splice(i,1)">✕</button>
        </div>
      </div>

      <div class="flex gap-2">
        <button :disabled="!filePreviews.length || uploading" class="btn-green text-xs"
          @click="doUpload">
          {{ uploading ? 'Uploading…' : `Upload ${filePreviews.length} photo(s)` }}
        </button>
        <button class="btn-ghost text-xs" @click="uploadModal = false">Cancel</button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAlertStore } from '@/stores/alertStore.js';
import AppModal from '@/components/common/AppModal.vue';
import api from '@/composables/useApi.js';

const alert        = useAlertStore();
const events       = ref([]);
const images       = ref([]);
const selectedEvent = ref('');
const loading      = ref(false);
const uploadModal  = ref(false);
const uploading    = ref(false);
const filePreviews = ref([]);

onMounted(async () => {
  const { data } = await api.get('/events');
  events.value = data.data || [];
});

const load = async () => {
  if (!selectedEvent.value) { images.value = []; return; }
  loading.value = true;
  try {
    const { data } = await api.get(`/gallery/${selectedEvent.value}`);
    images.value = data.data || [];
  } finally { loading.value = false; }
};

const handleFiles = (e) => {
  [...e.target.files].forEach(f => {
    const reader = new FileReader();
    reader.onload = (ev) => filePreviews.value.push({ file: f, preview: ev.target.result, caption: '' });
    reader.readAsDataURL(f);
  });
};
const handleDrop = (e) => {
  const dt = e.dataTransfer;
  const event = { target: { files: dt.files } };
  handleFiles(event);
};

const doUpload = async () => {
  uploading.value = true;
  try {
    const fd = new FormData();
    filePreviews.value.forEach(fp => {
      fd.append('images', fp.file);
      fd.append('captions', fp.caption);
    });
    await api.post(`/gallery/${selectedEvent.value}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    alert.success('Photos uploaded!'); filePreviews.value = []; uploadModal.value = false; load();
  } catch { alert.error('Upload failed.'); }
  finally { uploading.value = false; }
};

const deleteImage = async (id) => {
  if (!confirm('Delete this image?')) return;
  try { await api.delete(`/gallery/${id}`); alert.success('Deleted.'); load(); }
  catch { alert.error('Delete failed.'); }
};
</script>
