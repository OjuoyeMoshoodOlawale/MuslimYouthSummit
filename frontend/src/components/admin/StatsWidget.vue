<template>
  <div class="bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{{ label }}</p>
        <p class="font-display font-bold text-3xl text-brand-green tabular-nums">{{ value }}</p>
        <p v-if="sub" class="text-xs text-gray-500 mt-1.5">{{ sub }}</p>
      </div>
      <div class="w-12 h-12 flex items-center justify-center flex-shrink-0"
        :class="iconBg">
        <span class="text-2xl">{{ icon }}</span>
      </div>
    </div>

    <!-- trend -->
    <div v-if="trend !== null" class="mt-4 pt-4 border-t border-gray-50 flex items-center gap-1">
      <span class="text-xs font-semibold" :class="trend >= 0 ? 'text-green-600' : 'text-red-500'">
        {{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
      <span class="text-xs text-gray-400">vs previous event</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label:   { type: String,  required: true },
  value:   { type: [String,Number], required: true },
  icon:    { type: String,  default: '•' },
  sub:     { type: String,  default: '' },
  trend:   { type: Number,  default: null },
  iconBg:  { type: String,  default: 'bg-brand-cream' },
});
</script>
