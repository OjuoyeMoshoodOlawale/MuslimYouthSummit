<template>
  <div class="min-h-screen font-body">

    <!-- ── STICKY NAV ─────────────────────────────────────── -->
    <nav class="fixed top-0 inset-x-0 z-50 transition-all duration-500"
      :class="scrolled ? 'bg-brand-green/96 backdrop-blur-md shadow-lg' : 'bg-transparent'">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button @click="scrollTo('top')" class="flex items-center">
          <img src="/logos/logo-white.png" alt="MYS" class="h-9" />
        </button>
        <div class="hidden md:flex items-center gap-7 text-white/80 text-sm font-semibold">
          <button v-for="l in navLinks" :key="l.id"
            class="hover:text-brand-gold transition-colors duration-200"
            @click="scrollTo(l.id)">{{ l.label }}</button>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="eventStore.hasActiveEvent"
            class="btn-gold text-xs py-2 px-4 hidden md:inline-flex"
            @click="scrollTo('tickets')">
            <Ticket :size="13" /> Register for Ticket
          </button>
          <a href="/admin/login" class="text-white/40 hover:text-white/80 transition-colors ml-2">
            <Lock :size="15" />
          </a>
        </div>
      </div>
    </nav>

    <!-- ── HERO ───────────────────────────────────────────── -->
    <section class="relative min-h-screen bg-brand-green geometric-bg flex flex-col
                    items-center justify-center text-white overflow-hidden">
      <!-- Decorative blobs -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full
                  bg-brand-gold/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full
                  bg-brand-lightgreen/5 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

      <!-- Animated gold beam sweep (plays once on load) -->
      <div class="beam-sweep pointer-events-none absolute inset-0 overflow-hidden opacity-0"
        ref="beamRef"></div>

      <!-- Content -->
      <div class="relative text-center px-6 max-w-5xl mx-auto pt-20 space-y-6">

        <!-- Logo — float animation -->
        <div class="float-anim inline-block"
          :class="heroStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'"
          style="transition: all 0.7s cubic-bezier(0.16,1,0.3,1)">
          <img src="/logos/logo-white.png" alt="Muslim Youth Summit"
            class="h-24 md:h-32 mx-auto drop-shadow-2xl" />
        </div>

        <!-- Live badge -->
        <div v-if="eventStore.hasActiveEvent"
          :class="heroStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
          style="transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1)"
          class="flex justify-center">
          <div class="inline-flex items-center gap-2 bg-brand-gold/15 border border-brand-gold/40
                      text-brand-gold text-xs font-bold uppercase tracking-[0.2em] px-5 py-2">
            <span class="w-2 h-2 rounded-full bg-brand-gold pulse-glow"></span>
            {{ eventStore.activeEvent.edition }} · Registration Open
          </div>
        </div>

        <!-- Title -->
        <h1 class="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.05]"
          :class="heroStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
          style="transition: all 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s">
          <template v-if="eventStore.hasActiveEvent">
            <span class="bg-gradient-to-r from-white via-white/95 to-white/70 bg-clip-text text-transparent">
              {{ eventStore.activeEvent.title }}
            </span>
          </template>
          <template v-else>Muslim Youth Summit</template>
        </h1>

        <!-- Tagline -->
        <p class="text-white/65 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          :class="heroStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          style="transition: all 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s">
          <template v-if="eventStore.hasActiveEvent">{{ eventStore.activeEvent.tagline }}</template>
          <template v-else>Reforming hearts. Building leaders. Connecting futures.</template>
        </p>

        <!-- Event meta -->
        <div v-if="eventStore.hasActiveEvent"
          class="flex items-center justify-center gap-6 flex-wrap text-sm text-white/50"
          :class="heroStep >= 4 ? 'opacity-100' : 'opacity-0'"
          style="transition: opacity 0.5s ease 0.2s">
          <span class="flex items-center gap-2">
            <CalendarDays :size="15" class="text-brand-gold" />
            {{ formatDateRange(eventStore.activeEvent.start_date, eventStore.activeEvent.end_date) }}
          </span>
          <span v-if="eventStore.activeEvent.venue" class="flex items-center gap-2">
            <MapPin :size="15" class="text-brand-gold" />
            {{ eventStore.activeEvent.venue }}
          </span>
        </div>

        <!-- Countdown -->
        <div v-if="eventStore.hasActiveEvent"
          :class="heroStep >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          style="transition: all 0.6s ease 0.2s">
          <p class="text-white/30 text-xs uppercase tracking-[0.25em] mb-4">Event Countdown</p>
          <CountdownTimer :targetDate="eventStore.activeEvent.start_date + 'T08:00:00'" />
        </div>

        <!-- CTAs -->
        <div :class="heroStep >= 6 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'"
          style="transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.25s">
          <template v-if="eventStore.hasActiveEvent">
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
              <button class="btn-gold text-sm px-10 py-4 w-full sm:w-auto justify-center"
                @click="scrollTo('tickets')">
                <Ticket :size="18" /> Register for Ticket
              </button>
              <button class="btn-white text-sm px-10 py-4 w-full sm:w-auto justify-center"
                @click="scrollTo('schedule')">
                <CalendarCheck :size="18" /> View Programme
              </button>
            </div>
          </template>
          <template v-else>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
              <button class="btn-gold text-sm px-10 py-4" @click="scrollTo('about')">
                <Sparkles :size="18" /> About the Summit
              </button>
              <button class="btn-white text-sm px-10 py-4" @click="scrollTo('past-events')">
                <History :size="18" /> Past Editions
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Scroll cue -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
        :class="heroStep >= 6 ? 'opacity-100' : 'opacity-0'"
        style="transition: opacity 0.5s ease 0.5s">
        <span class="text-white/20 text-xs uppercase tracking-[0.2em]">Scroll</span>
        <ChevronDown :size="20" class="text-white/30" />
      </div>
    </section>

    <!-- ── ABOUT ─────────────────────────────────────────── -->
    <section id="about" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div class="reveal-left">
            <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Sparkles :size="13" /> About the Summit
            </p>
            <h2 class="font-display font-bold text-4xl md:text-5xl text-brand-green mb-6 leading-tight">
              Empowering the<br />Muslim Youth
            </h2>
            <p class="text-gray-600 leading-relaxed mb-4">
              The Muslim Youth Summit (MYS) is an annual programme dedicated to Islamic youth
              reformation, career development, and building meaningful connections among young
              Muslim professionals.
            </p>
            <p class="text-gray-600 leading-relaxed mb-8">
              Through impactful lectures, interactive sessions, and networking opportunities, MYS
              creates a platform where faith and ambition come together to shape the next generation.
            </p>
            <div class="grid grid-cols-3 gap-6">
              <div v-for="stat in aboutStats" :key="stat.label"
                class="text-center reveal" :class="stat.delay">
                <p class="font-display font-bold text-3xl text-brand-green">{{ stat.value }}</p>
                <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">{{ stat.label }}</p>
              </div>
            </div>
          </div>
          <div class="relative reveal-right">
            <div class="absolute -top-4 -right-4 w-48 h-48 bg-brand-gold/15 -z-0"></div>
            <div class="relative bg-brand-green text-white p-8 z-10">
              <p class="font-display font-bold text-2xl mb-4 text-brand-gold flex items-center gap-2">
                <Target :size="22" /> Our Mission
              </p>
              <p class="text-white/80 leading-relaxed">
                To nurture a generation of Muslim youth grounded in Islamic values, equipped
                with modern knowledge, and empowered to lead with excellence in all spheres of life.
              </p>
              <div class="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-3 text-sm">
                <div v-for="p in pillars" :key="p.label" class="flex items-center gap-2">
                  <component :is="p.icon" :size="15" class="text-brand-gold flex-shrink-0" />
                  <span>{{ p.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── SPEAKERS ───────────────────────────────────────── -->
    <section v-if="eventStore.speakers.length" id="speakers" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14 reveal">
          <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
            <Mic :size="13" /> Featured Speakers
          </p>
          <h2 class="font-display font-bold text-4xl text-brand-green">Invited Scholars &amp; Experts</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SpeakerCard v-for="(s, i) in eventStore.speakers" :key="s.id" :speaker="s"
            class="reveal" :class="`reveal-delay-${(i%4)+1}`" />
        </div>
      </div>
    </section>

    <!-- ── PROGRAMME ─────────────────────────────────────── -->
    <section v-if="eventStore.hasActiveEvent" id="schedule" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-end justify-between mb-12 reveal">
          <div>
            <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
              <LayoutList :size="13" /> Event Programme
            </p>
            <h2 class="font-display font-bold text-4xl text-brand-green">Full Schedule</h2>
          </div>
          <button class="btn-green text-xs hidden md:inline-flex" @click="scrollTo('tickets')">
            <Ticket :size="13" /> Secure Your Spot
          </button>
        </div>
        <ProgrammeTable :schedule="lectures" :days="eventDays" />
        <p v-if="!lectures.length" class="text-center text-gray-400 text-sm mt-6">
          Schedule will be announced soon.
        </p>
      </div>
    </section>

    <!-- ── TICKETS ───────────────────────────────────────── -->
    <section v-if="eventStore.hasActiveEvent && eventStore.ticketTypes.length" id="tickets"
      class="py-24 bg-brand-green geometric-bg relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-green via-brand-green to-[#013a24]"></div>
      <div class="relative max-w-7xl mx-auto px-6">
        <div class="text-center mb-14 reveal">
          <p class="text-white/40 font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
            <ShoppingCart :size="13" /> Secure Your Spot
          </p>
          <h2 class="font-display font-bold text-4xl text-white">Get Your Ticket</h2>
          <p class="text-white/40 mt-2 flex items-center justify-center gap-2 text-sm">
            <MapPin :size="13" /> {{ eventStore.activeEvent?.venue }}
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <TicketCard v-for="(tt, i) in eventStore.ticketTypes" :key="tt.id"
            :type="tt" :featured="i === 0"
            :earlyBirdCloses="eventStore.activeEvent.early_bird_closes_at"
            class="reveal" :class="`reveal-delay-${i+1}`"
            @select="selectTicket" />
        </div>
        <p class="text-center text-white/25 text-xs mt-8 flex items-center justify-center gap-2">
          <ShieldCheck :size="13" /> Secure payments via Paystack
        </p>
      </div>
    </section>

    <!-- ── GALLERY ───────────────────────────────────────── -->
    <section v-if="gallery.length" id="gallery" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14 reveal">
          <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
            <Images :size="13" /> Moments
          </p>
          <h2 class="font-display font-bold text-4xl text-brand-green">Event Gallery</h2>
        </div>
        <GalleryMasonry :images="gallery" />
      </div>
    </section>

    <!-- ── PAST EVENTS ───────────────────────────────────── -->
    <section id="past-events" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-end justify-between mb-12 reveal">
          <div>
            <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
              <History :size="13" /> History
            </p>
            <h2 class="font-display font-bold text-4xl text-brand-green">Past Editions</h2>
          </div>
          <RouterLink to="/past-events" class="btn-outline text-xs">
            View All <ArrowRight :size="13" />
          </RouterLink>
        </div>
        <div v-if="pastEvents.length" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(evt, i) in pastEvents.slice(0,3)" :key="evt.id"
            class="bg-white border border-gray-100 hover:border-brand-gold transition-all
                   duration-300 overflow-hidden group reveal" :class="`reveal-delay-${i+1}`">
            <div class="h-48 bg-brand-green/10 overflow-hidden relative">
              <img v-if="evt.cover_image_url" :src="evt.cover_image_url" :alt="evt.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="font-display font-bold text-5xl text-brand-green/20">{{ evt.edition }}</span>
              </div>
            </div>
            <div class="p-5">
              <span class="badge-gold text-xs mb-2">{{ evt.edition }}</span>
              <h3 class="font-display font-bold text-brand-green mt-2">{{ evt.title }}</h3>
              <p class="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <CalendarDays :size="12" />
                {{ formatDateRange(evt.start_date, evt.end_date) }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-400">
          <p class="text-sm">Past event records will appear here.</p>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ────────────────────────────────────────── -->
    <footer class="bg-brand-green text-white py-14">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row items-start justify-between gap-10 pb-10 border-b border-white/10">
          <div class="max-w-xs">
            <img src="/logos/logo-white.png" alt="MYS" class="h-12 mb-4" />
            <p class="text-white/45 text-sm leading-relaxed">
              Annual programme dedicated to Islamic youth reformation, career development
              and community building.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-x-16 gap-y-3">
            <div>
              <p class="text-brand-gold font-bold text-xs uppercase tracking-wider mb-3">Navigate</p>
              <div class="space-y-2">
                <button v-for="l in navLinks" :key="l.id"
                  class="block text-white/55 hover:text-brand-gold transition-colors text-sm text-left"
                  @click="scrollTo(l.id)">{{ l.label }}</button>
              </div>
            </div>
            <div>
              <p class="text-brand-gold font-bold text-xs uppercase tracking-wider mb-3">Quick Links</p>
              <div class="space-y-2 text-sm">
                <RouterLink to="/past-events" class="block text-white/55 hover:text-brand-gold transition-colors">Past Events</RouterLink>
                <button v-if="eventStore.hasActiveEvent"
                  class="block text-white/55 hover:text-brand-gold transition-colors text-left text-sm"
                  @click="scrollTo('tickets')">Register for Ticket</button>
                <a href="/admin/login" class="block text-white/55 hover:text-brand-gold transition-colors">Admin Portal</a>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-white/25 text-xs">
          <p>© {{ new Date().getFullYear() }} Muslim Youth Summit. All rights reserved.</p>
          <p class="flex items-center gap-1.5"><Heart :size="11" class="text-brand-gold" /> Built with purpose</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Ticket, CalendarDays, MapPin, ChevronDown, Sparkles, Target, Mic,
  LayoutList, ShoppingCart, ShieldCheck, Images, History, ArrowRight,
  Lock, Heart, CalendarCheck, BookOpen, Briefcase, Users, GraduationCap,
} from 'lucide-vue-next';
import { useEventStore }       from '@/stores/eventStore.js';
import { useScrollReveal }     from '@/composables/useScrollReveal.js';
import CountdownTimer          from '@/components/landing/CountdownTimer.vue';
import SpeakerCard             from '@/components/landing/SpeakerCard.vue';
import TicketCard              from '@/components/landing/TicketCard.vue';
import GalleryMasonry          from '@/components/landing/GalleryMasonry.vue';
import ProgrammeTable          from '@/components/landing/ProgrammeTable.vue';
import api from '@/composables/useApi.js';

const router      = useRouter();
const eventStore  = useEventStore();
const { setupReveal } = useScrollReveal();

const scrolled    = ref(false);
const gallery     = ref([]);
const lectures    = ref([]);
const eventDays   = ref([]);
const pastEvents  = ref([]);
const heroStep    = ref(0);

const navLinks = [
  { id:'about',       label:'About'         },
  { id:'speakers',    label:'Speakers'      },
  { id:'schedule',    label:'Programme'     },
  { id:'tickets',     label:'Tickets'       },
  { id:'past-events', label:'Past Editions' },
];

const scrollTo = (id) => {
  if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 70; // nav height
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
};

const aboutStats = [
  { value:'3+',   label:'Editions',  delay:'reveal-delay-1' },
  { value:'500+', label:'Attendees', delay:'reveal-delay-2' },
  { value:'20+',  label:'Speakers',  delay:'reveal-delay-3' },
];

// ✅ Only use icons that exist in lucide-vue-next
const pillars = [
  { icon: BookOpen,      label: 'Islamic Reformation' },
  { icon: Briefcase,     label: 'Career Development'  },
  { icon: Users,         label: 'Networking'           },
  { icon: GraduationCap, label: 'Knowledge Sharing'   },
];

let scrollHandler;
let stepTimers = [];

onMounted(async () => {
  // Scroll listener
  scrollHandler = () => { scrolled.value = window.scrollY > 40; };
  window.addEventListener('scroll', scrollHandler, { passive: true });

  // Cinematic hero entrance — step-by-step
  const delays = [50, 200, 500, 900, 1300, 1800];
  delays.forEach((ms, i) => {
    const t = setTimeout(() => { heroStep.value = i + 1; }, ms);
    stepTimers.push(t);
  });

  // Load event data
  await eventStore.fetchActiveEvent();
  await eventStore.fetchPastEvents();
  pastEvents.value = eventStore.pastEvents;

  if (eventStore.hasActiveEvent) {
    const eid = eventStore.activeEvent.id;
    try {
      const [galRes, lecRes, dayRes] = await Promise.all([
        api.get(`/gallery/${eid}`),
        api.get(`/events/${eid}/schedule`),
        api.get(`/events/${eid}/days`),
      ]);
      gallery.value   = galRes.data.data || [];
      const schData   = lecRes.data.data;
      lectures.value  = Array.isArray(schData) ? schData : (schData?.lectures || []);
      eventDays.value = dayRes.data.data || [];
    } catch {}
  }

  // Scroll reveal after DOM settles
  setTimeout(() => setupReveal(), 300);
});

onUnmounted(() => {
  window.removeEventListener('scroll', scrollHandler);
  stepTimers.forEach(clearTimeout);
});

const formatDateRange = (start, end) => {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts = { day:'numeric', month:'long', year:'numeric' };
  if (!e || s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-NG', opts);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return `${s.getDate()}–${e.toLocaleDateString('en-NG', opts)}`;
  return `${s.toLocaleDateString('en-NG',{day:'numeric',month:'short'})} – ${e.toLocaleDateString('en-NG',opts)}`;
};

const selectTicket = (type) => router.push({ name: 'register', query: { type: type.id } });
</script>

<style scoped>
/* Gold beam sweep on load */
.beam-sweep::after {
  content: '';
  position: absolute;
  top: -100%;
  left: -80%;
  width: 50%;
  height: 350%;
  background: linear-gradient(105deg, transparent 20%, rgba(254,199,0,0.18) 50%, transparent 80%);
  animation: beamSweepOnce 1.8s ease-in-out 0.4s forwards;
}
@keyframes beamSweepOnce {
  0%   { left: -80%; opacity: 1; }
  100% { left: 160%; opacity: 0; }
}
</style>
