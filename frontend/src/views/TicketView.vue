<template>
  <div class="min-h-screen bg-brand-cream">
    <!-- Nav -->
    <div class="bg-brand-green text-white px-4 md:px-6 py-4 flex items-center justify-between no-print">
      <RouterLink to="/"><img src="/logos/logo-white.png" alt="MYS" class="h-10" /></RouterLink>
      <button class="btn-gold text-xs flex items-center gap-1.5" @click="printTicket">
        <Printer :size="14" /> Print Ticket
      </button>
    </div>

    <div class="max-w-lg mx-auto px-4 md:px-6 py-10 md:py-12" id="ticket-print-area">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <Loader :size="36" class="animate-spin text-brand-green/40 mx-auto" />
        <p class="text-gray-500 mt-4 text-sm">Loading your ticket…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <XCircle :size="48" class="mx-auto mb-4 text-red-400" />
        <h2 class="font-display font-bold text-2xl text-brand-green mb-2">Ticket Not Found</h2>
        <p class="text-gray-500 mb-6">{{ error }}</p>
        <RouterLink to="/" class="btn-green">← Back to Home</RouterLink>
      </div>

      <!-- Ticket -->
      <div v-else-if="ticket" class="space-y-4">
        <!-- Status / balance banner -->
        <div class="text-center py-3 px-4 flex items-center justify-center gap-2"
          :class="ticket.status === 'paid' && !hasBalance
            ? 'bg-green-50 border border-green-200'
            : hasBalance
              ? 'bg-yellow-50 border border-yellow-300'
              : 'bg-yellow-50 border border-yellow-200'">
          <component :is="ticket.status === 'paid' && !hasBalance ? CheckCircle2 : AlertTriangle"
            :size="16"
            :class="ticket.status === 'paid' && !hasBalance ? 'text-green-600' : 'text-yellow-600'" />
          <p class="font-bold text-sm"
            :class="ticket.status === 'paid' && !hasBalance ? 'text-green-700' : 'text-yellow-700'">
            {{ ticket.status === 'paid' && !hasBalance
              ? 'Payment Confirmed — Full'
              : hasBalance
                ? `Balance Due: ₦${fmtP(ticket.balance_due)} — Please pay at the gate`
                : 'Payment Pending' }}
          </p>
        </div>

        <!-- Ticket card -->
        <div class="bg-white shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="bg-brand-green text-white p-6">
            <img src="/logos/logo-white.png" alt="MYS" class="h-10 mb-4" />
            <h2 class="font-display font-bold text-2xl">{{ ticket.event_title }}</h2>
            <p v-if="ticket.event_venue" class="text-white/60 text-sm mt-1 flex items-center gap-1.5">
              <MapPin :size="13" /> {{ ticket.event_venue }}
            </p>
            <p v-if="ticket.event_start_date" class="text-white/60 text-sm mt-1 flex items-center gap-1.5">
              <CalendarDays :size="13" /> {{ formatDate(ticket.event_start_date) }}
            </p>
          </div>

          <!-- Gold divider -->
          <div class="bg-brand-gold h-1.5"></div>

          <!-- Body -->
          <div class="p-6 space-y-5">
            <!-- Attendee info grid -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Name</p>
                <p class="font-bold text-gray-800">{{ ticket.participant_name }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Ticket Type</p>
                <p class="font-semibold text-gray-800">{{ ticket.ticket_type_name }}</p>
              </div>
              <div>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Amount Paid</p>
                <p class="font-bold text-brand-green">₦{{ fmtP(ticket.amount_paid) }}</p>
              </div>
              <div v-if="hasBalance">
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Balance Due</p>
                <p class="font-bold text-red-500">₦{{ fmtP(ticket.balance_due) }}</p>
              </div>
              <div v-if="ticket.payment_method">
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Payment Method</p>
                <p class="font-semibold text-gray-600 capitalize">{{ ticket.payment_method?.replace('_',' ') }}</p>
              </div>
              <div v-if="ticket.is_early_bird">
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Pricing</p>
                <span class="badge-gold text-xs">Early Bird</span>
              </div>
            </div>

            <!-- Balance alert -->
            <div v-if="hasBalance"
              class="bg-yellow-50 border border-yellow-200 p-4 rounded-sm text-sm">
              <p class="font-bold text-yellow-800 flex items-center gap-1.5 mb-1">
                <AlertTriangle :size="14" /> Outstanding Balance
              </p>
              <p class="text-yellow-700">
                You have an unpaid balance of <strong>₦{{ fmtP(ticket.balance_due) }}</strong>.
                Please complete payment at the registration desk before entry.
              </p>
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
              <div class="inline-block p-4 border-2 border-brand-green/20 bg-white"
                v-html="ticket.qr_code_svg"></div>
              <p class="text-xs text-gray-400 mt-3">Present this QR code at the entry point</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-brand-cream px-6 py-4 flex items-center justify-between">
            <p class="text-xs text-gray-400">Muslim Youth Summit · muslimyouthsummit.com</p>
            <p class="text-xs text-gray-400">{{ ticket.edition }}</p>
          </div>
        </div>

        <!-- Email note -->
        <p class="text-center text-xs text-gray-400">
          A copy of this ticket was sent to <strong>{{ ticket.participant_email }}</strong>
        </p>

        <!-- Print button (mobile) -->
        <div class="text-center no-print">
          <button class="btn-green text-xs flex items-center gap-2 mx-auto" @click="printTicket">
            <Printer :size="14" /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Printer, Loader, XCircle, CheckCircle2, AlertTriangle, MapPin, CalendarDays } from 'lucide-vue-next';
import api from '@/composables/useApi.js';

const route   = useRoute();
const ticket  = ref(null);
const loading = ref(true);
const error   = ref('');

const hasBalance = computed(() => ticket.value && Number(ticket.value.balance_due) > 0);

onMounted(async () => {
  const ref_ = route.params.ref || route.query.reference;
  try {
    if (route.query.reference) {
      const { data } = await api.get(`/tickets/verify/${route.query.reference}`);
      ticket.value = data.data?.ticket || data.data;
    } else {
      const { data } = await api.get(`/tickets/${ref_}`);
      ticket.value = data.data;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Ticket not found.';
  } finally {
    loading.value = false;
  }
});

const fmtP       = (n) => Number(n || 0).toLocaleString('en-NG');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'}) : '';
const printTicket = () => window.print();
</script>

<style>
@media print {
  .no-print, nav, header { display: none !important; }
  #ticket-print-area { padding: 0 !important; }
  body { background: white !important; }
  .bg-brand-cream { background: white !important; }
}
</style>
