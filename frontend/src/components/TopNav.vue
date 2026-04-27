<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const isActive = (path: string) => route.path === path || (path !== '/' && route.path.startsWith(path));
</script>

<template>
  <nav class="bg-paper border-b-0.5 border-ink-subtle">
    <div class="max-w-[1200px] mx-auto px-12 py-4 flex items-baseline justify-between">
      <router-link to="/" class="text-micro text-ink uppercase no-underline hover:underline">
        Data fluency · Harvard staff module
      </router-link>
      <div class="flex gap-6 text-small">
        <router-link to="/" class="text-link"
                     :class="isActive('/') && !isActive('/module') && !isActive('/dictionary') && !isActive('/demo') && !isActive('/about') && !isActive('/architecture') ? 'text-ink' : 'text-ink-muted hover:text-ink'">
          Home
        </router-link>
        <router-link to="/module/central-tendency" class="text-link"
                     :class="isActive('/module') ? 'text-ink' : 'text-ink-muted hover:text-ink'">
          Module
        </router-link>
        <router-link to="/dictionary" class="text-link"
                     :class="isActive('/dictionary') ? 'text-ink' : 'text-ink-muted hover:text-ink'">
          Dictionary
        </router-link>
        <router-link to="/demo/autoplay" class="text-link"
                     :class="isActive('/demo') ? 'text-ink' : 'text-ink-muted hover:text-ink'">
          Autoplay
        </router-link>
        <router-link to="/architecture" class="text-link"
                     :class="isActive('/architecture') ? 'text-ink' : 'text-ink-muted hover:text-ink'">
          Architecture
        </router-link>
        <router-link to="/about" class="text-link"
                     :class="isActive('/about') ? 'text-ink' : 'text-ink-muted hover:text-ink'">
          About
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.text-link { text-decoration: none; transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1); }
.text-link:hover { text-decoration: underline; }
</style>
