<script setup lang="ts"></script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[1200px] mx-auto px-12 py-16">
      <div class="text-micro text-ink-subtle uppercase">Capstone POC · 2026</div>
      <h1 class="text-h1 text-ink mt-4">Data fluency module</h1>
      <p class="text-body text-ink-muted mt-6 max-w-[640px]">
        A self-paced module for Harvard staff that fades scaffolding as the learner demonstrates mastery.
        The interface is the scaffold; the rule that picks the scaffold is in
        <code class="font-mono text-small">lib/scaffold-selector.ts</code>.
      </p>
      <ul class="mt-12 space-y-3 text-body">
        <li>
          <router-link to="/module/central-tendency" class="text-ink hover:underline">
            Begin: What "typical" really means →
          </router-link>
        </li>
        <li>
          <router-link to="/dictionary" class="text-ink hover:underline">
            Open the dictionary →
          </router-link>
        </li>
        <li>
          <router-link to="/demo/autoplay" class="text-ink hover:underline">
            Watch a 90-second autoplay (committee demo) →
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>
