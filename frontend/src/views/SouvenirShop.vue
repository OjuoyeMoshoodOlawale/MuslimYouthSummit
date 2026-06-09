<template>
  <div class="min-h-screen bg-brand-cream">
    <!-- Nav -->
    <nav class="bg-brand-green text-white px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <RouterLink to="/"><img src="/logos/logo-white.png" alt="MYS" class="h-9" /></RouterLink>
      <div class="flex items-center gap-4">
        <RouterLink to="/" class="text-white/60 text-sm hover:text-white transition-colors flex items-center gap-1.5">
          <ArrowLeft :size="14" /> Home
        </RouterLink>
        <button class="relative text-white/80 hover:text-white" @click="cartOpen=true">
          <ShoppingCart :size="20" />
          <span v-if="cartCount>0" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-gold text-brand-green text-xs font-bold rounded-full flex items-center justify-center">
            {{ cartCount }}
          </span>
        </button>
      </div>
    </nav>

    <!-- Hero -->
    <div class="bg-brand-green py-10 text-white text-center px-4">
      <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
        <ShoppingBag :size="13" /> Merchandise Store
      </p>
      <h1 class="font-display font-bold text-3xl md:text-4xl">MYS Souvenirs</h1>
      <p class="text-white/60 mt-2">Pre-order exclusive Muslim Youth Summit merchandise</p>
    </div>

    <!-- Products -->
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <div v-if="loading" class="flex justify-center py-20">
        <Loader :size="36" class="animate-spin text-brand-green/40 mx-auto" />
      </div>
      <div v-else-if="souvenirs.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div v-for="sv in souvenirs" :key="sv.id"
          class="bg-white border border-gray-100 hover:border-brand-green/30 hover:shadow-md transition-all overflow-hidden group">
          <div class="aspect-square bg-brand-cream/60 overflow-hidden cursor-pointer" @click="openBuy(sv)">
            <img v-if="sv.image_url" :src="sv.image_url" :alt="sv.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Package :size="48" class="text-brand-green/20" />
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-display font-bold text-brand-green text-base leading-tight">{{ sv.name }}</h3>
            <p v-if="sv.description" class="text-xs text-gray-500 mt-1 line-clamp-2">{{ sv.description }}</p>
            <div class="flex items-center justify-between mt-3">
              <p class="font-display font-bold text-2xl text-brand-green">₦{{ fmtP(sv.price) }}</p>
              <p v-if="sv.available_qty !== null" class="text-xs"
                :class="(sv.available_qty-sv.sold_qty)<10?'text-red-500 font-bold':'text-gray-400'">
                {{ sv.available_qty - sv.sold_qty }} left
              </p>
            </div>
            <button class="w-full mt-3 btn-gold text-xs py-2.5 justify-center"
              :disabled="sv.available_qty!==null && sv.sold_qty>=sv.available_qty"
              @click="openBuy(sv)">
              <ShoppingCart :size="13" />
              {{ sv.available_qty!==null && sv.sold_qty>=sv.available_qty ? 'Out of Stock' : 'Buy Now' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-20 text-gray-300">
        <Package :size="64" class="mx-auto mb-4 opacity-40" />
        <p class="text-lg font-semibold">No merchandise available yet.</p>
        <p class="text-sm mt-2">Check back soon!</p>
      </div>
    </div>

    <!-- Quick Buy Modal -->
    <Teleport to="body">
      <div v-if="buyModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="buyModal=false"></div>
        <div class="relative bg-white w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
          <!-- Product header -->
          <div class="bg-brand-green text-white p-5 flex items-center gap-4">
            <img v-if="buying?.image_url" :src="buying?.image_url" :alt="buying?.name"
              class="w-14 h-14 object-cover flex-shrink-0" />
            <div class="min-w-0">
              <p class="font-display font-bold text-lg leading-tight">{{ buying?.name }}</p>
              <p class="text-brand-gold font-bold">₦{{ fmtP(buying?.price) }}</p>
            </div>
            <button class="ml-auto text-white/60 hover:text-white flex-shrink-0" @click="buyModal=false">
              <X :size="20" />
            </button>
          </div>

          <form @submit.prevent="submitOrder" class="p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Quantity</label>
                <div class="flex items-center gap-2">
                  <button type="button" class="w-8 h-8 border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-sm"
                    @click="buyQty = Math.max(1, buyQty-1)">–</button>
                  <span class="font-bold text-brand-green w-8 text-center">{{ buyQty }}</span>
                  <button type="button" class="w-8 h-8 border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-sm"
                    @click="buyQty++">+</button>
                </div>
              </div>
              <div class="flex items-end">
                <div>
                  <p class="label">Total</p>
                  <p class="font-display font-bold text-xl text-brand-green">₦{{ fmtP((buying?.price||0)*buyQty) }}</p>
                </div>
              </div>
            </div>

            <div>
              <label class="label">Full Name <span class="text-red-500">*</span></label>
              <input v-model="buyForm.buyer_name" class="input" :class="{'input-error':buyErrs.name}"
                placeholder="Abdullahi Musa" />
              <p v-if="buyErrs.name" class="text-red-500 text-xs mt-1">{{ buyErrs.name }}</p>
            </div>
            <div>
              <label class="label">Email <span class="text-red-500">*</span></label>
              <input v-model="buyForm.buyer_email" type="email" class="input" :class="{'input-error':buyErrs.email}"
                placeholder="you@email.com" />
              <p v-if="buyErrs.email" class="text-red-500 text-xs mt-1">{{ buyErrs.email }}</p>
            </div>
            <div>
              <label class="label">Phone</label>
              <input v-model="buyForm.buyer_phone" class="input" placeholder="080XXXXXXXX" />
            </div>
            <div>
              <label class="label">Delivery Address <span class="text-gray-400 font-normal text-xs">(if applicable)</span></label>
              <textarea v-model="buyForm.delivery_address" class="input text-sm" rows="2"
                placeholder="House no, street, city, state…" />
            </div>

            <p v-if="buyErr" class="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2">
              <AlertCircle :size="14" class="flex-shrink-0 mt-0.5" />{{ buyErr }}
            </p>

            <button type="submit" :disabled="buyBusy" class="btn-gold w-full justify-center py-3.5 text-base">
              <component :is="buyBusy ? Loader : CreditCard" :size="16" :class="buyBusy?'animate-spin':''" />
              {{ buyBusy ? 'Processing…' : `Pay ₦${fmtP((buying?.price||0)*buyQty)} with Paystack` }}
            </button>
            <p class="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck :size="13" class="text-green-500" />
              Secured by Paystack · Order confirmed by email
            </p>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Cart Sidebar -->
    <Teleport to="body">
      <div v-if="cartOpen" class="fixed inset-0 z-[100] flex justify-end">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cartOpen=false"></div>
        <div class="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 class="font-display font-bold text-brand-green text-lg flex items-center gap-2">
              <ShoppingCart :size="18" /> Cart ({{ cartCount }})
            </h3>
            <button @click="cartOpen=false"><X :size="20" class="text-gray-400" /></button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <div v-if="!cart.length" class="text-center py-12 text-gray-300">
              <ShoppingCart :size="48" class="mx-auto mb-3 opacity-40" />
              <p class="text-sm">Your cart is empty</p>
            </div>
            <div v-for="item in cart" :key="item.id" class="flex items-start gap-3 bg-gray-50 p-3">
              <img v-if="item.image_url" :src="item.image_url" class="w-16 h-16 object-cover flex-shrink-0" />
              <div v-else class="w-16 h-16 bg-brand-cream flex items-center justify-center flex-shrink-0">
                <Package :size="24" class="text-brand-green/30" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-gray-800 truncate">{{ item.name }}</p>
                <p class="text-brand-green font-bold">₦{{ fmtP(item.price) }}</p>
                <div class="flex items-center gap-2 mt-1.5">
                  <button class="w-6 h-6 border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100"
                    @click="updateQty(item.id, item.qty-1)">–</button>
                  <span class="text-sm font-semibold w-6 text-center">{{ item.qty }}</span>
                  <button class="w-6 h-6 border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100"
                    @click="updateQty(item.id, item.qty+1)">+</button>
                </div>
              </div>
              <button class="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0" @click="removeFromCart(item.id)">
                <X :size="15" />
              </button>
            </div>
          </div>
          <div v-if="cart.length" class="border-t border-gray-100 p-5 space-y-4">
            <div class="flex justify-between font-display font-bold text-xl">
              <span>Total</span>
              <span class="text-brand-green">₦{{ fmtP(cartTotal) }}</span>
            </div>
            <button class="w-full btn-gold py-4 justify-center" @click="checkoutCart">
              <CreditCard :size="16" /> Checkout ({{ cartCount }} items)
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-green text-white px-6 py-3 shadow-xl flex items-center gap-3 z-[200]">
          <CheckCircle2 :size="18" class="text-brand-gold" />
          <span class="text-sm font-semibold">{{ toast }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  ArrowLeft, ShoppingCart, ShoppingBag, Package, X, CreditCard,
  Loader, ShieldCheck, CheckCircle2, AlertCircle,
} from 'lucide-vue-next';
import api from '@/composables/useApi.js';

const souvenirs = ref([]);
const loading   = ref(true);
const buyModal  = ref(false);
const cartOpen  = ref(false);
const buying    = ref(null);
const buyQty    = ref(1);
const buyBusy   = ref(false);
const buyErr    = ref('');
const toast     = ref('');

const buyForm = reactive({ buyer_name:'', buyer_email:'', buyer_phone:'', delivery_address:'' });
const buyErrs = reactive({ name:'', email:'' });

const cart = ref(JSON.parse(sessionStorage.getItem('mys_cart') || '[]'));
const saveCart = () => sessionStorage.setItem('mys_cart', JSON.stringify(cart.value));
const cartCount = computed(() => cart.value.reduce((s,i)=>s+i.qty,0));
const cartTotal = computed(() => cart.value.reduce((s,i)=>s+(i.price*i.qty),0));

const route = useRoute();

onMounted(async () => {
  try { const { data } = await api.get('/souvenirs'); souvenirs.value = data.data||[]; }
  catch {} finally {
    loading.value=false;
    // Auto-open buy modal if ?buy=id param is present (from landing page)
    if (route.query.buy) {
      const sv = souvenirs.value.find(s => String(s.id) === String(route.query.buy));
      if (sv) openBuy(sv);
    }
  }
});

const fmtP = (n) => Number(n||0).toLocaleString('en-NG');

const showToast = (msg) => { toast.value=msg; setTimeout(()=>{toast.value='';},2500); };

const openBuy = (sv) => {
  buying.value = sv;
  buyQty.value = 1;
  buyErr.value = '';
  Object.assign(buyErrs, { name:'', email:'' });
  buyModal.value = true;
};

/* Single item quick buy via Paystack */
const submitOrder = async () => {
  buyErrs.name  = buyForm.buyer_name.trim() ? '' : 'Name is required.';
  buyErrs.email = /\S+@\S+\.\S+/.test(buyForm.buyer_email) ? '' : 'Valid email required.';
  if (buyErrs.name || buyErrs.email) return;

  buyBusy.value = true; buyErr.value = '';
  try {
    const { data } = await api.post(`/souvenirs/${buying.value.id}/order`, {
      ...buyForm,
      quantity: buyQty.value,
    });
    const { payment_url, reference } = data.data || {};

    // Paystack inline popup if public key available
    const pubKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (pubKey && window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: pubKey, email: buyForm.buyer_email,
        amount: Math.round(buying.value.price * buyQty.value * 100),
        ref: reference, currency: 'NGN',
        onClose: () => { buyBusy.value=false; },
        callback: () => {
          buyModal.value=false;
          showToast('Order confirmed! Check your email.');
        },
      });
      handler.openIframe();
      return;
    }

    // Fallback: full page redirect
    if (payment_url) { window.location.href = payment_url; return; }
    buyModal.value = false;
    showToast('Order placed! Redirecting to payment…');
  } catch (e) {
    buyErr.value = e.response?.data?.message || 'Order failed. Please try again.';
  } finally { buyBusy.value = false; }
};

/* Cart helpers */
const updateQty = (id,qty) => { if(qty<1){removeFromCart(id);return;} const i=cart.value.find(x=>x.id===id); if(i){i.qty=qty;saveCart();} };
const removeFromCart = (id) => { cart.value=cart.value.filter(i=>i.id!==id); saveCart(); };
const checkoutCart = () => { cartOpen.value=false; if(cart.value.length) openBuy(cart.value[0]); };
</script>

<style scoped>
.slide-up-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity:0; transform:translate(-50%,20px); }
</style>
