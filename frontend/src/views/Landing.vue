<template>
  <div class="min-h-screen font-body">

    <!-- ── STICKY NAV ────────────────────────────────────── -->
    <nav class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      :class="scrolled ? 'bg-brand-green/95 backdrop-blur-md shadow-lg' : 'bg-transparent'">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <img src="/logos/logo-white.png" alt="MYS" class="h-9" />
        <div class="hidden md:flex items-center gap-7 text-white/80 text-sm font-semibold">
          <a v-for="l in navLinks" :key="l.href" :href="l.href"
            class="hover:text-brand-gold transition-colors">{{ l.label }}</a>
        </div>
        <div class="flex items-center gap-2">
          <a v-if="eventStore.hasActiveEvent" href="#tickets"
            class="btn-gold text-xs py-2 px-4 hidden md:inline-flex">
            <Ticket :size="14" /> Buy Ticket
          </a>
          <a href="/admin/login" class="text-white/50 hover:text-white text-xs ml-2">
            <Lock :size="14" class="inline" />
          </a>
        </div>
      </div>
    </nav>

    <!-- ── HERO (animated entrance) ──────────────────────────── -->
    <HeroAnimation>
      <template #badge>
        <template v-if="eventStore.hasActiveEvent">
          <div class="inline-flex items-center gap-2 bg-brand-gold/15 border border-brand-gold/30
                      text-brand-gold text-xs font-bold uppercase tracking-[0.2em] px-5 py-2">
            <span class="w-2 h-2 rounded-full bg-brand-gold pulse-glow"></span>
            {{ eventStore.activeEvent.edition }} · Registration Open
          </div>
        </template>
      </template>

      <template #title>
        <template v-if="eventStore.hasActiveEvent">
          <span class="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            {{ eventStore.activeEvent.title }}
          </span>
        </template>
        <template v-else>Muslim Youth Summit</template>
      </template>

      <template #tagline>
        <template v-if="eventStore.hasActiveEvent">{{ eventStore.activeEvent.tagline }}</template>
        <template v-else>Reforming hearts. Building leaders. Connecting futures.</template>
      </template>

      <template #meta>
        <div v-if="eventStore.hasActiveEvent" class="flex items-center justify-center gap-6 text-sm text-white/50 flex-wrap">
          <span class="flex items-center gap-2"><CalendarDays :size="15" class="text-brand-gold" />
            {{ formatDateRange(eventStore.activeEvent.start_date, eventStore.activeEvent.end_date) }}
          </span>
          <span v-if="eventStore.activeEvent.venue" class="flex items-center gap-2">
            <MapPin :size="15" class="text-brand-gold" /> {{ eventStore.activeEvent.venue }}
          </span>
        </div>
      </template>

      <template #countdown>
        <div v-if="eventStore.hasActiveEvent">
          <p class="text-white/30 text-xs uppercase tracking-[0.25em] mb-4">Event Countdown</p>
          <CountdownTimer :targetDate="eventStore.activeEvent.start_date + 'T08:00:00'" />
        </div>
      </template>

      <template #cta>
        <div v-if="eventStore.hasActiveEvent" class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#tickets" class="btn-gold text-sm px-10 py-4 w-full sm:w-auto justify-center text-center">
            <Ticket :size="18" /> Register &amp; Buy Ticket
          </a>
          <a href="#schedule" class="btn-white text-sm px-10 py-4 w-full sm:w-auto justify-center">
            <CalendarCheck :size="18" /> View Programme
          </a>
        </div>
        <div v-else>
          <a href="#past-events" class="btn-gold px-10 py-4">
            <Clock :size="18" /> View Past Editions
          </a>
        </div>
      </template>

      <template #scroll>
        <div class="flex flex-col items-center gap-2 animate-bounce">
          <span class="text-white/20 text-xs uppercase tracking-[0.2em]">Scroll</span>
          <ChevronDown :size="20" class="text-white/30" />
        </div>
      </template>
    </HeroAnimation>

    <!-- ── ABOUT ─────────────────────────────────────────── -->
    <section id="about" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div class="reveal-left">
            <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Sparkles :size="14" /> About the Summit
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
              creates a platform where faith and ambition come together.
            </p>
            <div class="grid grid-cols-3 gap-6">
              <div v-for="stat in aboutStats" :key="stat.label" class="text-center reveal" :class="stat.delay">
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
                To nurture a generation of Muslim youth grounded in Islamic values, equipped with
                modern knowledge, and empowered to lead with excellence in all spheres of life.
              </p>
              <div class="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-3 text-sm">
                <div v-for="pillar in pillars" :key="pillar.label" class="flex items-center gap-2">
                  <component :is="pillar.icon" :size="16" class="text-brand-gold flex-shrink-0" />
                  <span>{{ pillar.label }}</span>
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
            <Mic :size="14" /> Invited Scholars &amp; Experts
          </p>
          <h2 class="font-display font-bold text-4xl text-brand-green">Featured Speakers</h2>
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
              <LayoutList :size="14" /> Event Programme
            </p>
            <h2 class="font-display font-bold text-4xl text-brand-green">Full Schedule</h2>
          </div>
          <a href="#tickets" class="btn-green text-xs hidden md:inline-flex">
            <Ticket :size="14" /> Secure Your Spot
          </a>
        </div>
        <ProgrammeTable :schedule="lectures" :days="eventDays" />
        <p v-if="!lectures.length" class="text-center text-gray-400 text-sm mt-6">
          Schedule will be announced soon — check back later.
        </p>
      </div>
    </section>

    <!-- ── TICKETS ────────────────────────────────────────── -->
    <section v-if="eventStore.hasActiveEvent && eventStore.ticketTypes.length" id="tickets"
      class="py-24 bg-brand-green geometric-bg relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-green to-[#013a24]"></div>
      <div class="relative max-w-7xl mx-auto px-6">
        <div class="text-center mb-14 reveal">
          <p class="text-white/50 font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
            <ShoppingCart :size="14" /> Secure Your Spot
          </p>
          <h2 class="font-display font-bold text-4xl text-white">Get Your Ticket</h2>
          <p class="text-white/50 mt-3 flex items-center justify-center gap-2 text-sm">
            <MapPin :size="14" /> {{ eventStore.activeEvent?.venue }}
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <TicketCard v-for="(tt, i) in eventStore.ticketTypes" :key="tt.id"
            :type="tt" :featured="i===0"
            :earlyBirdCloses="eventStore.activeEvent.early_bird_closes_at"
            class="reveal" :class="`reveal-delay-${i+1}`"
            @select="selectTicket" />
        </div>
        <p class="text-center text-white/30 text-xs mt-8 flex items-center justify-center gap-2">
          <ShieldCheck :size="14" /> Secure payments powered by Paystack
        </p>
      </div>
    </section>

    <!-- ── GALLERY ────────────────────────────────────────── -->
    <section v-if="gallery.length" id="gallery" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14 reveal">
          <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
            <Images :size="14" /> Moments
          </p>
          <h2 class="font-display font-bold text-4xl text-brand-green">Event Gallery</h2>
        </div>
        <GalleryMasonry :images="gallery" />
      </div>
    </section>

    <!-- ── PAST EVENTS ────────────────────────────────────── -->
    <section id="past-events" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-end justify-between mb-12 reveal">
          <div>
            <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
              <History :size="14" /> History
            </p>
            <h2 class="font-display font-bold text-4xl text-brand-green">Past Editions</h2>
          </div>
          <RouterLink to="/past-events" class="btn-outline text-xs">
            View All <ArrowRight :size="14" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(evt, i) in pastEvents.slice(0,3)" :key="evt.id"
            class="bg-white border border-gray-100 hover:border-brand-gold transition-all duration-300
                   overflow-hidden group reveal cursor-pointer" :class="`reveal-delay-${i+1}`">
            <div class="h-48 bg-brand-green/10 overflow-hidden relative">
              <img v-if="evt.cover_image_url" :src="evt.cover_image_url" :alt="evt.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="font-display font-bold text-5xl text-brand-green/20">{{ evt.edition }}</span>
              </div>
              <div class="absolute inset-0 bg-brand-green/0 group-hover:bg-brand-green/10 transition-all"></div>
            </div>
            <div class="p-5">
              <span class="badge-gold text-xs mb-2">{{ evt.edition }}</span>
              <h3 class="font-display font-bold text-brand-green mt-2">{{ evt.title }}</h3>
              <p class="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <CalendarDays :size="13" /> {{ formatDateRange(evt.start_date, evt.end_date) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ─────────────────────────────────────────── -->
    <footer class="bg-brand-green text-white py-14">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row items-start justify-between gap-10 pb-10 border-b border-white/10">
          <div class="max-w-xs">
            <img src="/logos/logo-white.png" alt="MYS" class="h-12 mb-4" />
            <p class="text-white/50 text-sm leading-relaxed">
              An annual programme dedicated to Islamic youth reformation, career development,
              and community building.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-x-16 gap-y-3">
            <div>
              <p class="text-brand-gold font-bold text-xs uppercase tracking-wider mb-3">Navigate</p>
              <div class="space-y-2">
                <a v-for="l in navLinks" :key="l.href" :href="l.href"
                  class="block text-white/60 hover:text-brand-gold transition-colors text-sm">{{ l.label }}</a>
              </div>
            </div>
            <div>
              <p class="text-brand-gold font-bold text-xs uppercase tracking-wider mb-3">Quick Links</p>
              <div class="space-y-2 text-sm">
                <RouterLink to="/past-events" class="block text-white/60 hover:text-brand-gold transition-colors">Past Events</RouterLink>
                <a href="#tickets" class="block text-white/60 hover:text-brand-gold transition-colors">Buy Ticket</a>
                <a href="/admin/login" class="block text-white/60 hover:text-brand-gold transition-colors">Admin Portal</a>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-white/30 text-xs">
          <p>© {{ new Date().getFullYear() }} Muslim Youth Summit. All rights reserved.</p>
          <p class="flex items-center gap-1.5"><Heart :size="12" class="text-brand-gold" /> Built with purpose</p>
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
  Lock, Clock, Heart, CalendarCheck,
} from 'lucide-vue-next';
import { useEventStore } from '@/stores/eventStore.js';
import { useScrollReveal } from '@/composables/useScrollReveal.js';
import HeroAnimation   from '@/components/landing/HeroAnimation.vue';
import CountdownTimer  from '@/components/landing/CountdownTimer.vue';
import SpeakerCard     from '@/components/landing/SpeakerCard.vue';
import TicketCard      from '@/components/landing/TicketCard.vue';
import GalleryMasonry  from '@/components/landing/GalleryMasonry.vue';
import ProgrammeTable  from '@/components/landing/ProgrammeTable.vue';
import api from '@/composables/useApi.js';

const router      = useRouter();
const eventStore  = useEventStore();
const { setupReveal } = useScrollReveal();

const scrolled    = ref(false);
const gallery     = ref([]);
const lectures    = ref([]);
const eventDays   = ref([]);
const pastEvents  = ref([]);

const navLinks = [
  { href:'#about',       label:'About'     },
  { href:'#speakers',    label:'Speakers'  },
  { href:'#schedule',    label:'Programme' },
  { href:'#tickets',     label:'Tickets'   },
  { href:'#past-events', label:'Past Editions' },
];

const aboutStats = [
  { value:'3+',   label:'Editions',  delay:'reveal-delay-1' },
  { value:'500+', label:'Attendees', delay:'reveal-delay-2' },
  { value:'20+',  label:'Speakers',  delay:'reveal-delay-3' },
];

const pillars = [
  { icon: 'Mosque',      label:'Islamic Reformation' },
  { icon: 'Briefcase',   label:'Career Development'  },
  { icon: 'Users',       label:'Networking'          },
  { icon: 'BookOpen',    label:'Knowledge Sharing'   },
];

// Import icons for pillars dynamically
import { Mosque as _M, Briefcase, Users, BookOpen } from 'lucide-vue-next';
const iconMap = { Mosque: _M, Briefcase, Users, BookOpen };
pillars.forEach(p => p.icon = iconMap[p.icon]);

let scrollHandler;
onMounted(async () => {
  scrollHandler = () => { scrolled.value = window.scrollY > 40; };
  window.addEventListener('scroll', scrollHandler, { passive: true });

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

  // Kick off scroll animations after DOM settles
  setTimeout(() => setupReveal(), 100);
});

onUnmounted(() => window.removeEventListener('scroll', scrollHandler));

const formatDateRange = (start, end) => {
  const s = new Date(start), e = new Date(end);
  const opts = { day:'numeric', month:'long', year:'numeric' };
  if (!end || s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-NG', opts);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return `${s.getDate()}–${e.toLocaleDateString('en-NG', opts)}`;
  return `${s.toLocaleDateString('en-NG',{day:'numeric',month:'short'})} – ${e.toLocaleDateString('en-NG',opts)}`;
};

const selectTicket = (type) => router.push({ name:'register', query:{ type: type.id } });
</script>
