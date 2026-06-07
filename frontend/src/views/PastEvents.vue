<template>
  <div class="min-h-screen bg-brand-cream">
    <!-- Navbar -->
    <div class="bg-brand-green text-white px-6 py-4 flex items-center justify-between">
      <RouterLink to="/"><img src="/logos/logo-white.png" alt="MYS" class="h-10" /></RouterLink>
      <RouterLink to="/" class="text-white/60 text-sm hover:text-white transition-colors">← Back to Home</RouterLink>
    </div>

    <!-- Hero -->
    <div class="bg-brand-green geometric-bg py-16 text-white text-center px-6">
      <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3">History</p>
      <h1 class="font-display font-bold text-4xl md:text-5xl">Past Editions</h1>
      <p class="text-white/60 mt-3 text-lg">A journey through our annual summits</p>
    </div>

    <!-- Events -->
    <div class="max-w-7xl mx-auto px-6 py-16">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
      </div>

      <div v-else-if="events.length" class="space-y-16">
        <div v-for="evt in events" :key="evt.id">
          <!-- Event header -->
          <div class="border-l-4 border-brand-gold pl-6 mb-8">
            <div class="flex items-start justify-between flex-wrap gap-4">
              <div>
                <span class="badge-gold text-xs mb-2 inline-flex">{{ evt.edition }}</span>
                <h2 class="font-display font-bold text-3xl text-brand-green mt-1">{{ evt.title }}</h2>
                <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>📅 {{ formatRange(evt.start_date, evt.end_date) }}</span>
                  <span v-if="evt.venue">📍 {{ evt.venue }}</span>
                </div>
                <p v-if="evt.description" class="text-gray-600 mt-3 max-w-2xl">{{ evt.description }}</p>
              </div>
            </div>
          </div>

          <!-- Gallery for this event -->
          <div v-if="evt.gallery?.length">
            <GalleryMasonry :images="evt.gallery" />
          </div>
          <div v-else class="bg-white border border-dashed border-gray-200 py-10 text-center text-gray-300">
            <p class="text-4xl mb-2">🖼</p>
            <p class="text-sm">No photos for this edition</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-20 text-gray-400">
        <p class="text-5xl mb-4">📅</p>
        <p class="font-display text-xl">No past events yet.</p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-brand-green text-white py-8 text-center">
      <RouterLink to="/" class="btn-gold text-sm">Register for Next Edition →</RouterLink>
      <p class="text-white/30 text-xs mt-6">© {{ new Date().getFullYear() }} Muslim Youth Summit</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import GalleryMasonry from '@/components/landing/GalleryMasonry.vue';
import api from '@/composables/useApi.js';

const events  = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await api.get('/events/past?include_gallery=1');
    events.value = data.data || [];
  } catch {} finally {
    loading.value = false;
  }
});

const formatRange = (start, end) => {
  const s = new Date(start), e = new Date(end);
  const opts = { day:'numeric', month:'long', year:'numeric' };
  if (s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-NG', opts);
  return `${s.toLocaleDateString('en-NG',{day:'numeric',month:'long'})} – ${e.toLocaleDateString('en-NG', opts)}`;
};
</script>
