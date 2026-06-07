<template>
  <div class="min-h-screen font-body">
    <!-- ── NAVBAR ─────────────────────────────────────────── -->
    <nav class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      :class="scrolled ? 'bg-brand-green shadow-lg' : 'bg-transparent'">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <img src="/logos/logo-white.png" alt="MYS" class="h-10" />
        <div class="hidden md:flex items-center gap-8 text-white/80 text-sm font-semibold">
          <a v-for="link in navLinks" :key="link.href" :href="link.href"
            class="hover:text-brand-gold transition-colors">{{ link.label }}</a>
        </div>
        <a href="#tickets" v-if="eventStore.hasActiveEvent" class="btn-gold text-xs hidden md:inline-flex">
          Get Tickets
        </a>
        <a href="/admin/login" class="text-white/50 hover:text-white text-xs md:hidden">Admin</a>
      </div>
    </nav>

    <!-- ── HERO ───────────────────────────────────────────── -->
    <section class="relative min-h-screen bg-brand-green geometric-bg flex flex-col items-center justify-center text-white overflow-hidden pt-16">
      <!-- geometric decorative elements -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 translate-x-32 -translate-y-16"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-brand-light/10 -translate-x-48 translate-y-48 rotate-45"></div>

      <div class="relative text-center px-6 max-w-4xl mx-auto">
        <img src="/logos/logo-white.png" alt="Muslim Youth Summit" class="h-24 md:h-36 mx-auto mb-8 drop-shadow-lg" />

        <template v-if="eventStore.hasActiveEvent">
          <div class="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-bold uppercase tracking-widest px-4 py-2 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
            {{ eventStore.activeEvent.edition }} · Registration Open
          </div>

          <h1 class="font-display font-bold text-4xl md:text-6xl lg:text-7xl mb-4 leading-tight">
            {{ eventStore.activeEvent.title }}
          </h1>
          <p class="text-white/70 text-lg md:text-xl mb-6 max-w-2xl mx-auto leading-relaxed">
            {{ eventStore.activeEvent.tagline }}
          </p>

          <div class="flex items-center justify-center gap-6 text-sm text-white/60 mb-10">
            <span class="flex items-center gap-2">
              📅 {{ formatDateRange(eventStore.activeEvent.start_date, eventStore.activeEvent.end_date) }}
            </span>
            <span v-if="eventStore.activeEvent.venue" class="flex items-center gap-2">
              📍 {{ eventStore.activeEvent.venue }}
            </span>
          </div>

          <!-- Countdown -->
          <div class="mb-10 max-w-xs mx-auto">
            <p class="text-white/40 text-xs uppercase tracking-widest mb-4">Event Countdown</p>
            <CountdownTimer :targetDate="eventStore.activeEvent.start_date + 'T08:00:00'" />
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#tickets" class="btn-gold text-base px-8 py-4">Register Now →</a>
            <a href="#about" class="border border-white/30 text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-all">Learn More</a>
          </div>
        </template>

        <template v-else>
          <h1 class="font-display font-bold text-5xl md:text-7xl mb-6">Muslim Youth Summit</h1>
          <p class="text-white/60 text-xl">Reforming hearts. Building leaders. Connecting futures.</p>
          <a href="#past-events" class="btn-gold mt-8">View Past Events</a>
        </template>
      </div>

      <!-- scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
        <span class="text-xs uppercase tracking-widest">Scroll</span>
        <span class="text-xl">↓</span>
      </div>
    </section>

    <!-- ── ABOUT ───────────────────────────────────────────── -->
    <section id="about" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-4">About the Summit</p>
            <h2 class="font-display font-bold text-4xl md:text-5xl text-brand-green mb-6 leading-tight">
              Empowering the<br />Muslim Youth
            </h2>
            <p class="text-gray-600 leading-relaxed mb-4">
              The Muslim Youth Summit (MYS) is an annual programme dedicated to Islamic youth reformation,
              career development, and building meaningful connections among young Muslim professionals.
            </p>
            <p class="text-gray-600 leading-relaxed mb-8">
              Through impactful lectures, interactive sessions, and networking opportunities, MYS creates
              a platform where faith and ambition come together to shape the next generation of Muslim leaders.
            </p>
            <div class="grid grid-cols-3 gap-6">
              <div class="text-center">
                <p class="font-display font-bold text-3xl text-brand-green">3+</p>
                <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Editions</p>
              </div>
              <div class="text-center">
                <p class="font-display font-bold text-3xl text-brand-green">500+</p>
                <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Attendees</p>
              </div>
              <div class="text-center">
                <p class="font-display font-bold text-3xl text-brand-green">20+</p>
                <p class="text-xs text-gray-500 uppercase tracking-wider mt-1">Speakers</p>
              </div>
            </div>
          </div>
          <div class="relative">
            <div class="absolute -top-4 -right-4 w-48 h-48 bg-brand-gold/20 -z-0"></div>
            <div class="relative bg-brand-green text-white p-8 z-10">
              <p class="font-display font-bold text-2xl mb-4 text-brand-gold">Our Mission</p>
              <p class="text-white/80 leading-relaxed">
                To nurture a generation of Muslim youth grounded in Islamic values, equipped with modern
                knowledge, and empowered to lead with excellence in all spheres of life.
              </p>
              <div class="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2"><span>🕌</span> Islamic Reformation</div>
                <div class="flex items-center gap-2"><span>💼</span> Career Development</div>
                <div class="flex items-center gap-2"><span>🤝</span> Networking</div>
                <div class="flex items-center gap-2"><span>📚</span> Knowledge Sharing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── SPEAKERS ────────────────────────────────────────── -->
    <section v-if="eventStore.speakers.length" id="speakers" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14">
          <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3">Invited Scholars & Experts</p>
          <h2 class="font-display font-bold text-4xl text-brand-green">Featured Speakers</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SpeakerCard v-for="s in eventStore.speakers" :key="s.id" :speaker="s" />
        </div>
      </div>
    </section>

    <!-- ── PROGRAMME (Schedule) ────────────────────────────────── -->
    <section v-if="eventStore.hasActiveEvent" id="schedule" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-12">
          <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3">Event Programme</p>
          <h2 class="font-display font-bold text-4xl text-brand-green">Full Schedule</h2>
          <p class="text-gray-500 mt-2 text-sm">{{ eventStore.activeEvent?.venue }}</p>
        </div>
        <ProgrammeTable :schedule="lectures" :days="eventDays" />
        <p v-if="!lectures.length" class="text-center text-gray-400 text-sm mt-6">
          Schedule will be announced soon — check back later.
        </p>
      </div>
    </section>

    <!-- ── TICKETS ─────────────────────────────────────────── -->
    <section v-if="eventStore.hasActiveEvent && eventStore.ticketTypes.length" id="tickets" class="py-24 bg-brand-green geometric-bg">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14">
          <p class="text-white/50 font-bold text-xs uppercase tracking-[0.3em] mb-3">Secure Your Spot</p>
          <h2 class="font-display font-bold text-4xl text-white">Get Your Ticket</h2>
          <p class="text-white/60 mt-3">{{ eventStore.activeEvent.venue }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <TicketCard
            v-for="(tt, i) in eventStore.ticketTypes"
            :key="tt.id"
            :type="tt"
            :featured="i === 0"
            :earlyBirdCloses="eventStore.activeEvent.early_bird_closes_at"
            @select="selectTicket"
          />
        </div>
      </div>
    </section>

    <!-- ── GALLERY ─────────────────────────────────────────── -->
    <section v-if="gallery.length" id="gallery" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14">
          <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3">Moments</p>
          <h2 class="font-display font-bold text-4xl text-brand-green">Event Gallery</h2>
        </div>
        <GalleryMasonry :images="gallery" />
      </div>
    </section>

    <!-- ── PAST EVENTS ─────────────────────────────────────── -->
    <section id="past-events" class="py-24 bg-brand-cream">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-end justify-between mb-12">
          <div>
            <p class="text-brand-gold font-bold text-xs uppercase tracking-[0.3em] mb-3">History</p>
            <h2 class="font-display font-bold text-4xl text-brand-green">Past Editions</h2>
          </div>
          <RouterLink to="/past-events" class="text-sm text-brand-green underline font-semibold hover:no-underline">
            View all →
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="evt in pastEvents.slice(0,3)" :key="evt.id"
            class="bg-white border border-gray-100 hover:border-brand-gold transition-colors overflow-hidden group">
            <div class="h-48 bg-brand-green/10 overflow-hidden">
              <img v-if="evt.cover_image_url" :src="evt.cover_image_url"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="font-display font-bold text-4xl text-brand-green/20">{{ evt.edition }}</span>
              </div>
            </div>
            <div class="p-5">
              <span class="badge-light text-xs mb-2">{{ evt.edition }}</span>
              <h3 class="font-display font-bold text-brand-green mt-2">{{ evt.title }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ formatDateRange(evt.start_date, evt.end_date) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ──────────────────────────────────────────── -->
    <footer class="bg-brand-green text-white py-12">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <img src="/logos/logo-white.png" alt="MYS" class="h-12 mb-3" />
            <p class="text-white/40 text-sm">Reforming hearts. Building leaders.</p>
          </div>
          <div class="flex gap-6 text-sm text-white/60">
            <RouterLink to="/past-events" class="hover:text-brand-gold transition-colors">Past Events</RouterLink>
            <a href="#about"   class="hover:text-brand-gold transition-colors">About</a>
            <a href="#tickets" class="hover:text-brand-gold transition-colors">Tickets</a>
            <a href="/admin/login" class="hover:text-brand-gold transition-colors">Admin</a>
          </div>
        </div>
        <div class="border-t border-white/10 mt-8 pt-6 text-center text-white/30 text-xs">
          © {{ new Date().getFullYear() }} Muslim Youth Summit. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useEventStore } from '@/stores/eventStore.js';
import CountdownTimer  from '@/components/landing/CountdownTimer.vue';
import SpeakerCard     from '@/components/landing/SpeakerCard.vue';
import TicketCard      from '@/components/landing/TicketCard.vue';
import GalleryMasonry  from '@/components/landing/GalleryMasonry.vue';
import ProgrammeTable  from '@/components/landing/ProgrammeTable.vue';
import { useRouter }   from 'vue-router';
import api from '@/composables/useApi.js';

const router     = useRouter();
const eventStore = useEventStore();
const scrolled   = ref(false);
const gallery    = ref([]);
const lectures   = ref([]);
const eventDays  = ref([]);
const pastEvents = ref([]);

const navLinks = [
  { href:'#about',       label:'About'     },
  { href:'#speakers',    label:'Speakers'  },
  { href:'#schedule',    label:'Schedule'  },
  { href:'#tickets',     label:'Tickets'   },
  { href:'#past-events', label:'Past Editions' },
];

onMounted(async () => {
  window.addEventListener('scroll', () => { scrolled.value = window.scrollY > 40; });
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
      gallery.value  = galRes.data.data || [];
      const schData  = lecRes.data.data;
      lectures.value = Array.isArray(schData) ? schData : (schData?.lectures || []);
      eventDays.value = dayRes.data.data || [];
    } catch {}
  }
});

const formatDateRange = (start, end) => {
  const s = new Date(start), e = new Date(end);
  const opts = { day:'numeric', month:'long', year:'numeric' };
  if (s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-NG', opts);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.toLocaleDateString('en-NG', opts)}`;
  }
  return `${s.toLocaleDateString('en-NG', { day:'numeric', month:'short' })} – ${e.toLocaleDateString('en-NG', opts)}`;
};

const selectTicket = (type) => {
  router.push({ name:'register', query: { type: type.id } });
};
</script>
