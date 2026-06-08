<template>
  <div class="relative w-full overflow-hidden" :style="{ height: '100vh', minHeight: '600px' }">
    <!-- Video-like cinematic layers -->
    <div class="absolute inset-0 bg-brand-green"></div>

    <!-- Animated background particles -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="p in particles" :key="p.id"
        class="absolute rounded-full bg-brand-gold/10"
        :style="p.style"></div>
    </div>

    <!-- Islamic geometric overlay -->
    <div class="absolute inset-0 geometric-bg opacity-100"></div>

    <!-- Sweeping light beam -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="beam" :style="{ opacity: beamVisible ? 0.15 : 0 }"></div>
    </div>

    <!-- Content — sequenced entrance -->
    <div class="relative h-full flex flex-col items-center justify-center text-white px-6 text-center"
      style="padding-top:80px">

      <!-- Step 1: Logo drops in -->
      <div class="float-anim mb-8 transition-all duration-700"
        :style="{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(-40px)' }">
        <img src="/logos/logo-white.png" alt="MYS" class="h-24 md:h-32 mx-auto drop-shadow-2xl" />
      </div>

      <!-- Step 2: Live badge -->
      <div class="mb-6 transition-all duration-500"
        :style="{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'scale(1)' : 'scale(0.8)' }">
        <slot name="badge" />
      </div>

      <!-- Step 3: Title types in -->
      <h1 class="font-display font-bold text-4xl md:text-6xl lg:text-7xl mb-5 leading-[1.05] transition-all duration-700"
        :style="{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'translateY(0)' : 'translateY(30px)' }">
        <slot name="title" />
      </h1>

      <!-- Step 4: Tagline -->
      <p class="text-white/65 text-lg md:text-xl mb-5 max-w-2xl mx-auto leading-relaxed transition-all duration-700"
        :style="{ opacity: step >= 4 ? 1 : 0, transform: step >= 4 ? 'translateY(0)' : 'translateY(20px)' }">
        <slot name="tagline" />
      </p>

      <!-- Step 4b: Meta info -->
      <div class="mb-10 transition-all duration-500"
        :style="{ opacity: step >= 4 ? 1 : 0 }">
        <slot name="meta" />
      </div>

      <!-- Step 5: Countdown reveals -->
      <div class="mb-12 transition-all duration-700"
        :style="{ opacity: step >= 5 ? 1 : 0, transform: step >= 5 ? 'translateY(0)' : 'translateY(20px)' }">
        <slot name="countdown" />
      </div>

      <!-- Step 6: CTAs slam in -->
      <div class="transition-all duration-500"
        :style="{ opacity: step >= 6 ? 1 : 0, transform: step >= 6 ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(10px)' }">
        <slot name="cta" />
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500"
      :style="{ opacity: step >= 6 ? 1 : 0 }">
      <slot name="scroll" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const step       = ref(0);
const beamVisible= ref(false);

// Generate floating particles
const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  style: {
    width:  `${Math.random() * 120 + 30}px`,
    height: `${Math.random() * 120 + 30}px`,
    left:   `${Math.random() * 100}%`,
    top:    `${Math.random() * 100}%`,
    animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate`,
    opacity: Math.random() * 0.4 + 0.05,
  },
}));

onMounted(() => {
  // Cinematic entrance sequence
  const sequence = [
    [300,  () => { step.value = 1; }],               // Logo drops
    [700,  () => { beamVisible.value = true; }],      // Light beam
    [900,  () => { step.value = 2; }],               // Badge
    [1200, () => { step.value = 3; }],               // Title
    [1700, () => { step.value = 4; }],               // Tagline + meta
    [2200, () => { step.value = 5; }],               // Countdown
    [2700, () => { step.value = 6; }],               // CTAs
    [3500, () => { beamVisible.value = false; }],    // Beam fades
  ];
  sequence.forEach(([delay, fn]) => setTimeout(fn, delay));
});
</script>

<style scoped>
.beam {
  position: absolute;
  top: -100%;
  left: -60%;
  width: 60%;
  height: 300%;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(254,199,0,1) 50%,
    transparent 70%
  );
  transform: rotate(0deg);
  transition: opacity 1.2s ease;
  animation: beamSweep 2s ease-in-out forwards;
}

@keyframes beamSweep {
  0%   { left: -60%; }
  100% { left: 160%; }
}
</style>
