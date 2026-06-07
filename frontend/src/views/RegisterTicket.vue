<template>
  <div class="min-h-screen bg-brand-cream">
    <!-- Header -->
    <div class="bg-brand-green text-white px-6 py-4 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-3">
        <img src="/logos/logo-white.png" alt="MYS" class="h-10" />
      </RouterLink>
      <p class="text-white/60 text-sm">Ticket Registration</p>
    </div>

    <div class="max-w-xl mx-auto px-6 py-12">
      <!-- No active event -->
      <div v-if="!eventStore.hasActiveEvent && !loading" class="text-center py-20">
        <p class="text-4xl mb-4">📅</p>
        <h2 class="font-display font-bold text-2xl text-brand-green mb-2">No Active Event</h2>
        <p class="text-gray-500 mb-6">Ticket registration is currently closed.</p>
        <RouterLink to="/" class="btn-green">← Back to Home</RouterLink>
      </div>

      <div v-else>
        <div class="mb-8">
          <p class="text-brand-gold font-bold text-xs uppercase tracking-widest mb-2">
            {{ eventStore.activeEvent?.edition }}
          </p>
          <h1 class="font-display font-bold text-3xl text-brand-green">
            {{ eventStore.activeEvent?.title }}
          </h1>
          <p class="text-gray-500 text-sm mt-2">
            {{ eventStore.activeEvent?.venue }} ·
            {{ formatDate(eventStore.activeEvent?.start_date) }}
          </p>
        </div>

        <!-- Ticket type picker -->
        <div class="bg-white border border-gray-100 p-5 mb-6">
          <h2 class="font-display font-bold text-base text-brand-green mb-4">Select Ticket Type</h2>
          <div class="space-y-3">
            <label v-for="tt in eventStore.ticketTypes" :key="tt.id"
              class="flex items-center justify-between p-4 border-2 cursor-pointer transition-all"
              :class="form.ticket_type_id === tt.id ? 'border-brand-green bg-brand-cream' : 'border-gray-100 hover:border-gray-300'">
              <div class="flex items-center gap-3">
                <input type="radio" v-model="form.ticket_type_id" :value="tt.id" class="accent-brand-green" />
                <div>
                  <p class="font-semibold text-sm">{{ tt.name }}</p>
                  <p v-if="isEarlyBird && tt.early_bird_price" class="text-xs text-brand-gold">Early Bird Active!</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-display font-bold text-lg text-brand-green">
                  ₦{{ fmtP(isEarlyBird && tt.early_bird_price ? tt.early_bird_price : tt.regular_price) }}
                </p>
                <p v-if="isEarlyBird && tt.early_bird_price" class="text-xs text-gray-400 line-through">
                  ₦{{ fmtP(tt.regular_price) }}
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Personal details -->
        <div class="bg-white border border-gray-100 p-5 mb-6">
          <h2 class="font-display font-bold text-base text-brand-green mb-4">Your Details</h2>
          <form class="space-y-4" @submit.prevent="pay" novalidate>
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="label">Full Name *</label>
                <input v-model="form.name" class="input" :class="{'input-error':errs.name}" placeholder="Abdullahi Musa" />
                <p v-if="errs.name" class="text-red-500 text-xs mt-1">{{ errs.name }}</p>
              </div>
              <div>
                <label class="label">Email *</label>
                <input v-model="form.email" type="email" class="input" :class="{'input-error':errs.email}" placeholder="you@email.com" />
                <p v-if="errs.email" class="text-red-500 text-xs mt-1">{{ errs.email }}</p>
              </div>
              <div>
                <label class="label">Phone *</label>
                <input v-model="form.phone" class="input" :class="{'input-error':errs.phone}" placeholder="080XXXXXXXX" />
                <p v-if="errs.phone" class="text-red-500 text-xs mt-1">{{ errs.phone }}</p>
              </div>
              <div>
                <label class="label">Gender</label>
                <select v-model="form.gender" class="input">
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label class="label">Occupation</label>
                <input v-model="form.occupation" class="input" placeholder="Student / Professional…" />
              </div>
            </div>

            <p v-if="serverError" class="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3">
              {{ serverError }}
            </p>

            <div class="pt-2 flex gap-3">
              <button type="submit" :disabled="processing || !form.ticket_type_id"
                class="btn-gold flex-1 justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="processing" class="flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></span>
                  Processing…
                </span>
                <span v-else>Pay ₦{{ fmtP(selectedPrice) }} →</span>
              </button>
            </div>

            <p class="text-center text-xs text-gray-400">
              🔒 Secure payment via Paystack · You'll receive your ticket by email
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventStore } from '@/stores/eventStore.js';
import api from '@/composables/useApi.js';

const router     = useRouter();
const route      = useRoute();
const eventStore = useEventStore();
const loading    = ref(true);
const processing = ref(false);
const serverError = ref('');

const form = reactive({
  name:'', email:'', phone:'', gender:'', occupation:'',
  ticket_type_id: route.query.type ? Number(route.query.type) : null,
});
const errs = reactive({ name:'', email:'', phone:'' });

onMounted(async () => {
  await eventStore.fetchActiveEvent();
  loading.value = false;
});

const isEarlyBird = computed(() =>
  eventStore.activeEvent?.early_bird_closes_at &&
  new Date(eventStore.activeEvent.early_bird_closes_at) > new Date()
);

const selectedType = computed(() =>
  eventStore.ticketTypes.find(t => t.id === form.ticket_type_id)
);

const selectedPrice = computed(() => {
  if (!selectedType.value) return 0;
  return isEarlyBird.value && selectedType.value.early_bird_price
    ? selectedType.value.early_bird_price
    : selectedType.value.regular_price;
});

const fmtP = (n) => Number(n || 0).toLocaleString('en-NG');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'}) : '';

const validate = () => {
  errs.name  = form.name  ? '' : 'Name is required.';
  errs.email = form.email && /\S+@\S+\.\S+/.test(form.email) ? '' : 'Valid email required.';
  errs.phone = form.phone ? '' : 'Phone is required.';
  return !Object.values(errs).some(Boolean);
};

const pay = async () => {
  if (!validate() || !form.ticket_type_id) return;
  serverError.value = '';
  processing.value  = true;
  try {
    const { data } = await api.post('/tickets/initiate', {
      ...form,
      event_id:       eventStore.activeEvent.id,
      ticket_type_id: form.ticket_type_id,
    });
    // Redirect to Paystack authorization URL
    window.location.href = data.data.authorization_url;
  } catch (err) {
    serverError.value = err.response?.data?.message || 'Payment initiation failed. Please try again.';
    processing.value  = false;
  }
};
</script>
