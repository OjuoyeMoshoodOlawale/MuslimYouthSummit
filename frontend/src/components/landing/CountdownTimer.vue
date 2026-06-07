<template>
  <div class="grid grid-cols-4 gap-4">
    <div v-for="unit in units" :key="unit.label" class="text-center">
      <div class="relative bg-black/20 border border-brand-gold/30 px-4 py-4 mb-2">
        <span class="font-display font-bold text-4xl md:text-5xl text-brand-gold tabular-nums">
          {{ unit.value }}
        </span>
      </div>
      <p class="text-xs uppercase tracking-[0.2em] text-white/60 font-semibold">{{ unit.label }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  targetDate: { type: String, required: true },
});

const now = ref(Date.now());
let timer;
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); }, 1000); });
onUnmounted(() => clearInterval(timer));

const diff = computed(() => {
  const delta = Math.max(0, new Date(props.targetDate).getTime() - now.value);
  const total = Math.floor(delta / 1000);
  return {
    days:    Math.floor(total / 86400),
    hours:   Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
});

const pad = (n) => String(n).padStart(2, '0');
const units = computed(() => [
  { value: String(diff.value.days).padStart(2,'0'),   label: 'Days' },
  { value: pad(diff.value.hours),   label: 'Hours' },
  { value: pad(diff.value.minutes), label: 'Minutes' },
  { value: pad(diff.value.seconds), label: 'Seconds' },
]);
</script>
