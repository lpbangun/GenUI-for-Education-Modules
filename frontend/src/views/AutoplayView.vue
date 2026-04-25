<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Autoplay timeline: 90 seconds, walks mastery 0.10 → 1.0 across 5 tiers.
const mastery = ref(0.10);
let timer: number | undefined;

function pickTier(m: number) {
  if (m >= 0.85) return { num: 5, name: 'WikiDraft' };
  if (m >= 0.65) return { num: 4, name: 'BareLongAnswer' };
  if (m >= 0.45) return { num: 3, name: 'GuidedShortAnswer' };
  if (m >= 0.20) return { num: 2, name: 'ScaffoldedMCQ' };
  return { num: 1, name: 'WorkedExample' };
}

onMounted(() => {
  const start = Date.now();
  timer = window.setInterval(() => {
    const t = Math.min(1, (Date.now() - start) / 90000);
    mastery.value = 0.10 + t * 0.85;
  }, 200);
});
onUnmounted(() => { if (timer !== undefined) clearInterval(timer); });
</script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[1200px] mx-auto px-12 py-16">
      <div class="text-micro text-ink-subtle uppercase">Autoplay · 90-second committee demo</div>
      <h1 class="text-h1 text-ink mt-4">The fade, observable</h1>
      <p class="text-body text-ink-muted mt-6 max-w-[640px]">
        Watch mastery rise from {{ (0.10).toFixed(2) }} to {{ (1.00).toFixed(2) }} over 90 seconds.
        The Scaffold Selector picks one of five components per turn — same concept, different surface.
      </p>
      <div class="mt-12 max-w-[640px]">
        <div class="text-small font-mono text-ink-muted">
          mastery = {{ mastery.toFixed(2) }} → tier {{ pickTier(mastery).num }} ({{ pickTier(mastery).name }})
        </div>
        <div class="mt-4 h-1 bg-overlay">
          <div class="h-1 bg-accent transition-all" :style="{ width: ((mastery - 0.10) / 0.90 * 100).toFixed(1) + '%' }"></div>
        </div>
        <div class="mt-12 p-8 bg-surface border-t-0.5"
             :style="{ borderTopColor: '#0A0A0A' }">
          <div class="text-micro text-ink-subtle uppercase">Now rendering: {{ pickTier(mastery).name }}</div>
          <p class="text-body text-ink mt-4">
            Once F010 is wired and content is generated, this region will render the actual
            scaffold component for the current mastery value, streaming from Gemini.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
