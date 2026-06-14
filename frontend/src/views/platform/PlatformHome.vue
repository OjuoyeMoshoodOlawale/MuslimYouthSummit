<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
    <div class="max-w-lg w-full text-center">
      <h1 class="font-display font-bold text-4xl sm:text-5xl mb-3">The Event Platform</h1>
      <p class="text-gray-400 mb-10">Branded event spaces for organisations — registration, check-in, tags, certificates, and more.</p>

      <div class="bg-gray-800 rounded-2xl p-6 space-y-4 text-left">
        <p class="text-sm text-gray-400">Go to an organisation's space:</p>
        <div class="flex gap-2">
          <span class="px-3 py-3 bg-gray-700 rounded-l-lg text-gray-400 text-sm flex items-center">theplatform.com/</span>
          <input v-model="slug" @keyup.enter="go"
            class="flex-1 bg-gray-700 px-3 py-3 outline-none text-white font-mono"
            placeholder="mys" />
          <button class="bg-brand-gold text-brand-green font-bold px-5 rounded-r-lg" @click="go">Go</button>
        </div>
        <div class="flex gap-2 flex-wrap pt-2">
          <button v-for="s in examples" :key="s" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full text-gray-300"
            @click="slug=s; go()">/{{ s }}</button>
        </div>
      </div>

      <RouterLink to="/platform/login" class="inline-block mt-8 text-sm text-gray-500 hover:text-white">
        Platform admin →
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const slug = ref('');
const examples = ['mys', 'icp'];
const go = () => { const s = slug.value.trim().toLowerCase(); if (s) router.push(`/${s}`); };
</script>
