<script setup lang="ts">
import { ref } from 'vue';
import LMSShell from '../components/LMSShell.vue';

const props = defineProps<{ concept_id: string }>();

const mastery = ref(0.10);

function tier(m: number): { num: number; name: string; color: string } {
  if (m >= 0.85) return { num: 5, name: 'WikiDraft', color: 'tier-5' };
  if (m >= 0.65) return { num: 4, name: 'BareLongAnswer', color: 'tier-4' };
  if (m >= 0.45) return { num: 3, name: 'GuidedShortAnswer', color: 'tier-3' };
  if (m >= 0.20) return { num: 2, name: 'ScaffoldedMCQ', color: 'tier-2' };
  return { num: 1, name: 'WorkedExample', color: 'tier-1' };
}
</script>

<template>
  <LMSShell
    moduleLabel="Module 3 of 7 · Data fluency for higher ed admin"
    lessonTitle="Reading distributions in context"
    audience="HGSE career consultant"
    :lessonsTotal="7"
    :lessonsCompleted="2"
    :currentIndex="3"
  >
    <section class="bg-surface p-8">
      <div class="h-0.5 w-8" :class="`bg-${tier(mastery).color}`"></div>
      <div class="text-micro text-ink-subtle uppercase mt-6">
        Tier {{ tier(mastery).num }} · {{ tier(mastery).name }}
      </div>
      <h2 class="text-h2 text-ink mt-4">
        Concept: <code class="font-mono text-small">{{ props.concept_id }}</code>
      </h2>
      <p class="text-body text-ink-muted mt-6">
        Scaffold component will render here once the backend (F010) is wired and the content
        catalog (F003/F006) is generated. Drag the slider below to preview which scaffold the
        rule-based selector picks at each mastery value.
      </p>

      <div class="mt-8">
        <label class="text-micro text-ink-subtle uppercase">Mastery (preview)</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model.number="mastery"
          class="w-full mt-3 accent-accent"
        />
        <div class="text-small text-ink-muted mt-2 font-mono">
          mastery = {{ mastery.toFixed(2) }} → {{ tier(mastery).name }}
        </div>
      </div>
    </section>
  </LMSShell>
</template>
