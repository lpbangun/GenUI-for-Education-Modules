<script setup lang="ts">
import TopNav from './components/TopNav.vue';
</script>

<template>
  <TopNav />
  <router-view />
  <footer class="border-t border-ink-subtle/30 mt-16 py-6">
    <div class="max-w-[1200px] mx-auto px-12 flex flex-wrap items-baseline justify-between gap-2 text-micro text-ink-subtle">
      <span>A project by Logani B · T127 capstone · 2026</span>
      <span>
        <a href="https://github.com/lpbangun/GenUI-for-Education-Modules"
           target="_blank" rel="noopener noreferrer"
           class="hover:text-ink hover:underline">
          source ↗
        </a>
      </span>
    </div>
  </footer>
</template>
