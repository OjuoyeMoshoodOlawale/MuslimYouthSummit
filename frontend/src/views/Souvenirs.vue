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
          <span v-if="cartCount > 0"
            class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-gold text-brand-green text-xs font-bold rounded-full flex items-center justify-center">
            {{ cartCount }}
          </span>
        </button>
      </div>
    </nav>

    <!-- Hero -->
    <div class="bg-brand-green geometric-bg py-10 md:py-14 text-white text-center px-4">
      <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
        <ShoppingBag :size="13" /> Merchandise Store
      </p>
      <h1 class="font-display font-bold text-3xl md:text-4xl">MYS Souvenirs</h1>
      <p class="text-white/60 mt-2">Pre-order exclusive Muslim Youth Summit merchandise</p>
    </div>

    <!-- Products -->
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <div v-if="loading" class="flex justify-center py-20">
        <Loader :size="36" class="animate-spin text-brand-green/40" />
      </div>
      <div v-else-if="souvenirs.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div v-for="sv in souvenirs" :key="sv.id"
          class="bg-white border border-gray-100 hover:border-brand-green/30 hover:shadow-md
                 transition-all duration-200 overflow-hidden group">
          <!-- Image -->
          <div class="aspect-square bg-brand-cream/60 overflow-hidden cursor-pointer" @click="openDetail(sv)">
            <img v-if="sv.image_url" :src="sv.image_url" :alt="sv.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2">
              <Package :size="48" class="text-brand-green/20" />
              <span class="text-xs text-gray-300">No image</span>
            </div>
          </div>
          <div class="p-4">
            <div v-if="sv.event_title" class="mb-1">
              <span class="badge-gold text-xs">{{ sv.edition }}</span>
            </div>
            <h3 class="font-display font-bold text-brand-green text-base leading-tight">{{ sv.name }}</h3>
            <p v-if="sv.description" class="text-xs text-gray-500 mt-1 line-clamp-2">{{ sv.description }}</p>

            <!-- Stock indicator -->
            <div class="mt-3 flex items-center justify-between">
              <p class="font-display font-bold text-2xl text-brand-green">₦{{ fmtP(sv.price) }}</p>
              <div v-if="sv.available_qty" class="text-xs"
                :class="(sv.available_qty - sv.sold_qty) < 10 ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ sv.available_qty - sv.sold_qty }} left
              </div>
            </div>

            <button
              class="w-full mt-3 btn-gold text-xs py-2.5 justify-center"
              :disabled="sv.available_qty !== null && sv.sold_qty >= sv.available_qty"
              :class="sv.available_qty !== null && sv.sold_qty >= sv.available_qty ? 'opacity-50 cursor-not-allowed' : ''"
              @click="addToCart(sv)">
              <ShoppingCart :size="13" />
              {{ sv.available_qty !== null && sv.sold_qty >= sv.available_qty ? 'Out of Stock' : 'Add to Cart' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-20 text-gray-300">
        <Package :size="64" class="mx-auto mb-4 opacity-40" />
        <p class="text-lg">No merchandise available yet.</p>
        <p class="text-sm mt-2">Check back soon!</p>
      </div>
    </div>

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
            <div v-for="item in cart" :key="item.id"
              class="flex items-start gap-3 bg-gray-50 p-3">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.name"
                class="w-16 h-16 object-cover flex-shrink-0" />
              <div v-else class="w-16 h-16 bg-brand-cream flex items-center justify-center flex-shrink-0">
                <Package :size="24" class="text-brand-green/30" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-gray-800 truncate">{{ item.name }}</p>
                <p class="text-brand-green font-bold">₦{{ fmtP(item.price) }}</p>
                <div class="flex items-center gap-2 mt-1.5">
                  <button class="w-6 h-6 border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100"
                    @click="updateQty(item.id, item.qty - 1)">–</button>
                  <span class="text-sm font-semibold w-6 text-center">{{ item.qty }}</span>
                  <button class="w-6 h-6 border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100"
                    @click="updateQty(item.id, item.qty + 1)">+</button>
                </div>
              </div>
              <button class="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                @click="removeFromCart(item.id)"><X :size="15" /></button>
            </div>
          </div>

          <div class="border-t border-gray-100 p-5 space-y-4">
            <div class="flex justify-between font-display font-bold text-xl">
              <span>Total</span>
              <span class="text-brand-green">₦{{ fmtP(cartTotal) }}</span>
            </div>
            <button v-if="cart.length" class="w-full btn-gold py-4 justify-center" @click="checkout">
              <CreditCard :size="16" /> Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Checkout Modal -->
    <AppModal v-model="checkoutModal" title="Complete Your Order" size="md">
      <form @submit.prevent="submitOrder" class="space-y-4">
        <div class="bg-brand-cream p-4 space-y-1.5">
          <div v-for="item in cart" :key="item.id" class="flex justify-between text-sm">
            <span>{{ item.name }} × {{ item.qty }}</span>
            <span class="font-semibold">₦{{ fmtP(item.price * item.qty) }}</span>
          </div>
          <div class="flex justify-between font-display font-bold text-brand-green border-t border-brand-gold/30 pt-2 mt-2">
            <span>Total</span><span>₦{{ fmtP(cartTotal) }}</span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">Full Name <span class="text-red-500">*</span></label>
            <input v-model="checkoutForm.buyer_name" class="input" :class="{'input-error':checkoutErrs.name}" placeholder="Your full name" />
            <p v-if="checkoutErrs.name" class="text-red-500 text-xs mt-1">{{ checkoutErrs.name }}</p>
          </div>
          <div>
            <label class="label">Email <span class="text-red-500">*</span></label>
            <input v-model="checkoutForm.buyer_email" type="email" class="input" :class="{'input-error':checkoutErrs.email}" />
            <p v-if="checkoutErrs.email" class="text-red-500 text-xs mt-1">{{ checkoutErrs.email }}</p>
          </div>
          <div>
            <label class="label">Phone</label>
            <input v-model="checkoutForm.buyer_phone" class="input" placeholder="080XXXXXXXXX" />
          </div>
        </div>
        <div>
          <label class="label">Delivery Address <span class="text-gray-400 font-normal text-xs">(if applicable)</span></label>
          <textarea v-model="checkoutForm.delivery_address" class="input text-sm" rows="2"
            placeholder="House no, street, city, state…" />
        </div>
        <p class="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-50 p-3">
          <ShieldCheck :size="13" class="text-brand-green" />
          Secure payment powered by Paystack. You'll be redirected to complete payment.
        </p>
        <div class="flex gap-2 pt-2 border-t border-gray-100">
          <button type="submit" :disabled="ordering" class="btn-gold flex-1 justify-center">
            <component :is="ordering ? Loader : CreditCard" :size="15" :class="ordering?'animate-spin':''" />
            {{ ordering ? 'Processing…' : `Pay ₦${fmtP(cartTotal)}` }}
          </button>
          <button type="button" class="btn-ghost text-xs" @click="checkoutModal=false">Cancel</button>
        </div>
      </form>
    </AppModal>

    <!-- Success toast -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="addedToast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-green text-white px-6 py-3 shadow-xl flex items-center gap-3 z-[200]">
          <CheckCircle2 :size="18" class="text-brand-gold" />
          <span class="text-sm font-semibold">Added to cart!</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import {
  ArrowLeft, ShoppingCart, ShoppingBag, Package, X, CreditCard, Loader,
  ShieldCheck, CheckCircle2,
} from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import api from '@/composables/useApi.js';

const souvenirs     = ref([]);
const loading       = ref(true);
const cartOpen      = ref(false);
const checkoutModal = ref(false);
const ordering      = ref(false);
const addedToast    = ref(false);

// Cart stored in sessionStorage
const cart = ref(JSON.parse(sessionStorage.getItem('mys_cart') || '[]'));
const saveCart = () => sessionStorage.setItem('mys_cart', JSON.stringify(cart.value));
const cartCount = computed(() => cart.value.reduce((s,i) => s+i.qty, 0));
const cartTotal = computed(() => cart.value.reduce((s,i) => s+(i.price*i.qty), 0));

const checkoutForm = reactive({ buyer_name:'', buyer_email:'', buyer_phone:'', delivery_address:'' });
const checkoutErrs = reactive({ name:'', email:'' });

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/souvenirs');
    souvenirs.value = data.data || [];
  } catch { souvenirs.value = []; }
  finally { loading.value = false; }
});

const fmtP = (n) => Number(n||0).toLocaleString('en-NG');

const addToCart = (sv) => {
  const existing = cart.value.find(i => i.id === sv.id);
  if (existing) existing.qty++;
  else cart.value.push({ id: sv.id, name: sv.name, price: Number(sv.price), image_url: sv.image_url, qty: 1 });
  saveCart();
  addedToast.value = true;
  setTimeout(() => { addedToast.value = false; }, 2500);
};

const updateQty = (id, qty) => {
  if (qty < 1) { removeFromCart(id); return; }
  const item = cart.value.find(i => i.id === id);
  if (item) { item.qty = qty; saveCart(); }
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter(i => i.id !== id);
  saveCart();
};

const checkout = () => { cartOpen.value=false; checkoutModal.value=true; };

const openDetail = (sv) => {
  // Could open a detail modal — for now just add to cart
  addToCart(sv);
};

const submitOrder = async () => {
  checkoutErrs.name  = checkoutForm.buyer_name.trim() ? '' : 'Name required.';
  checkoutErrs.email = /\S+@\S+\.\S+/.test(checkoutForm.buyer_email) ? '' : 'Valid email required.';
  if (checkoutErrs.name || checkoutErrs.email) return;

  ordering.value = true;
  try {
    // If multiple items in cart, create one order per item
    // For simplicity, order the first item and redirect (can be enhanced later)
    const firstItem = cart.value[0];
    const { data } = await api.post(`/souvenirs/${firstItem.id}/order`, {
      ...checkoutForm,
      quantity: firstItem.qty,
    });
    // Redirect to Paystack
    if (data.data?.payment_url) {
      sessionStorage.removeItem('mys_cart');
      window.location.href = data.data.payment_url;
    }
  } catch (e) {
    alert(e.response?.data?.message || 'Order failed. Please try again.');
  } finally { ordering.value = false; }
};
</script>

<style scoped>
.slide-up-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity:0; transform: translate(-50%, 20px); }
</style>
