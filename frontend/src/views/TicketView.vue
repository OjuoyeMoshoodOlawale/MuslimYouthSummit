<template>
  <div class="min-h-screen bg-brand-cream">
    <div class="bg-brand-green text-white px-6 py-4 flex items-center justify-between">
      <RouterLink to="/"><img src="/logos/logo-white.png" alt="MYS" class="h-10" /></RouterLink>
      <button class="btn-gold text-xs" @click="printTicket">🖨 Print Ticket</button>
    </div>

    <div class="max-w-lg mx-auto px-6 py-12" id="ticket-print-area">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mx-auto"></div>
        <p class="text-gray-500 mt-4 text-sm">Loading your ticket…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <p class="text-4xl mb-4">❌</p>
        <h2 class="font-display font-bold text-2xl text-brand-green mb-2">Ticket Not Found</h2>
        <p class="text-gray-500 mb-6">{{ error }}</p>
        <RouterLink to="/" class="btn-green">← Back to Home</RouterLink>
      </div>

      <!-- Ticket -->
      <div v-else-if="ticket" class="space-y-6">
        <!-- Status banner -->
        <div class="text-center py-4" :class="ticket.status === 'paid' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
          <p class="font-bold text-sm" :class="ticket.status === 'paid' ? 'text-green-700' : 'text-yellow-700'">
            {{ ticket.status === 'paid' ? '✅ Payment Confirmed' : '⏳ Payment Pending' }}
          </p>
        </div>

        <!-- Ticket card -->
        <div class="bg-white shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="bg-brand-green text-white p-6">
            <img src="/logos/logo-white.png" alt="MYS" class="h-10 mb-4" />
            <h2 class="font-display font-bold text-2xl">{{ ticket.event_title }}</h2>
            <p class="text-white/60 text-sm mt-1">{{ ticket.event_venue }}</p>
          </div>

          <!-- Gold divider with notches -->
          <div class="relative bg-brand-gold h-2"></div>

          <!-- Ticket body -->
          <div class="p-6 space-y-6">
            <!-- Attendee info -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Name</p>
                <p class="font-semibold text-gray-800">{{ ticket.participant_name }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Ticket Type</p>
                <p class="font-semibold text-gray-800">{{ ticket.ticket_type_name }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Date</p>
                <p class="font-semibold text-gray-800">{{ formatDate(ticket.event_start_date) }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Amount Paid</p>
                <p class="font-semibold text-brand-green">₦{{ fmtP(ticket.amount_paid) }}</p>
              </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-dashed border-gray-200"></div>

            <!-- Ticket number + QR -->
            <div class="text-center">
              <p class="text-xs text-gray-400 uppercase tracking-widest mb-2">Ticket Number</p>
              <p class="font-display font-bold text-3xl text-brand-green tracking-wider mb-4">
                {{ ticket.unique_number }}
              </p>
              <!-- QR Code -->
              <div class="inline-block p-3 border border-gray-100" v-html="ticket.qr_code_svg"></div>
              <p class="text-xs text-gray-400 mt-3">Present this QR code at the entry point</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-brand-cream px-6 py-4 flex items-center justify-between">
            <p class="text-xs text-gray-400">Issued by Muslim Youth Summit</p>
            <span v-if="ticket.is_early_bird" class="badge-gold text-xs">Early Bird</span>
          </div>
        </div>

        <p class="text-center text-xs text-gray-400">
          A copy of this ticket has been sent to <strong>{{ ticket.participant_email }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/composables/useApi.js';

const route  = useRoute();
const ticket  = ref(null);
const loading = ref(true);
const error   = ref('');

onMounted(async () => {
  const ref_ = route.params.ref || route.query.reference;
  try {
    if (route.query.reference) {
      // Paystack callback — verify payment and get ticket
      const { data } = await api.get(`/tickets/verify/${route.query.reference}`);
      // verifyTicketPayment returns { ticket: {...} } or { ticket: {...}, alreadyPaid: true }
      ticket.value = data.data?.ticket || data.data;
    } else {
      // Direct ticket lookup by unique number
      const { data } = await api.get(`/tickets/${ref_}`);
      ticket.value = data.data;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Ticket not found.';
  } finally {
    loading.value = false;
  }
});

const fmtP = (n) => Number(n || 0).toLocaleString('en-NG');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'}) : '';

const printTicket = () => window.print();
</script>

<style>
@media print {
  nav, button, .no-print { display: none !important; }
  #ticket-print-area { padding: 0 !important; }
  body { background: white !important; }
}
</style>
