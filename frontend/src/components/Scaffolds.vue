<script setup lang="ts">
import { computed } from 'vue';
import type { ScaffoldCall } from '../lib/api';
import { TIER_COLORS } from '../lib/api';

const props = defineProps<{ call: ScaffoldCall | null; loading?: boolean }>();

const tierNum = computed(() => {
  switch (props.call?.scaffold) {
    case 'WorkedExample': return 1;
    case 'ScaffoldedMCQ': return 2;
    case 'GuidedShortAnswer': return 3;
    case 'BareLongAnswer': return 4;
    case 'WikiDraft': return 5;
    default: return 0;
  }
});

const tierColor = computed(() => props.call ? TIER_COLORS[props.call.scaffold] : 'bg-ink-subtle');
</script>

<template>
  <section class="bg-surface p-8" v-if="loading || call">
    <div class="h-0.5 w-8" :class="tierColor"></div>

    <div v-if="loading" class="mt-6">
      <div class="text-micro text-ink-subtle uppercase">Generating scaffold…</div>
      <div class="mt-4 h-0.5 w-full bg-overlay overflow-hidden">
        <div class="h-0.5 bg-accent animate-[loading_1.5s_linear_infinite] w-1/3"></div>
      </div>
    </div>

    <template v-else-if="call">
      <div class="text-micro text-ink-subtle uppercase mt-6">
        Tier {{ tierNum }} · {{ call.scaffold }}
      </div>

      <!-- WorkedExample -->
      <template v-if="call.scaffold === 'WorkedExample'">
        <h2 class="text-h2 text-ink mt-4">{{ call.input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ call.input.setup_prose }}</p>
        <ol class="mt-4 space-y-3 list-decimal pl-6">
          <li v-for="(step, i) in call.input.worked_steps" :key="i" class="text-body">{{ step }}</li>
        </ol>
        <p class="text-body mt-6 whitespace-pre-line">{{ call.input.interpretation }}</p>
        <div class="mt-6" style="width:80px; border-top: 0.5px solid #8B8B8B;"></div>
        <div class="text-micro text-ink-subtle uppercase mt-6">Did this land?</div>
        <div class="space-y-3 mt-3">
          <label v-for="opt in ['Yes, I see why', 'Sort of — show me another', 'Not yet — slow down']" :key="opt"
                 class="block text-body cursor-pointer">
            <input type="radio" name="check" class="mr-3 accent-ink" />{{ opt }}
          </label>
        </div>
      </template>

      <!-- ScaffoldedMCQ -->
      <template v-else-if="call.scaffold === 'ScaffoldedMCQ'">
        <h2 class="text-h2 text-ink mt-4">{{ call.input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ call.input.setup_prose }}</p>
        <pre v-if="call.input.artifact_summary_stats"
             class="font-mono text-small mt-4 p-4 bg-accent-tint whitespace-pre-line">{{ call.input.artifact_summary_stats }}</pre>
        <p class="text-body mt-6">{{ call.input.prompt }}</p>
        <div class="space-y-3 mt-4">
          <label v-for="opt in (call.input.options ?? [])" :key="opt.id"
                 class="block border border-ink-subtle p-4 hover:border-ink cursor-pointer transition">
            <span class="font-mono text-small text-ink-subtle mr-3">{{ opt.id }}</span>
            <span class="text-body">{{ opt.text }}</span>
          </label>
        </div>
        <div class="mt-6" style="width:48px; border-top: 0.5px solid #8B8B8B;"></div>
        <div class="text-micro text-ink-subtle uppercase mt-6">Hint</div>
        <p class="text-small text-ink-muted mt-2 whitespace-pre-line">{{ call.input.hint }}</p>
      </template>

      <!-- GuidedShortAnswer -->
      <template v-else-if="call.scaffold === 'GuidedShortAnswer'">
        <h2 class="text-h2 text-ink mt-4">{{ call.input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ call.input.setup_prose }}</p>
        <p class="text-body mt-6">{{ call.input.prompt }}</p>
        <textarea rows="5" placeholder="Type your response…"
                  class="w-full mt-4 p-3 border border-ink-subtle bg-surface text-body resize-none focus:outline-none focus:border-accent"></textarea>
        <div class="text-micro text-ink-subtle uppercase mt-6">Consider</div>
        <ul class="text-small text-ink-muted mt-2 space-y-2">
          <li v-for="(s, i) in (call.input.consider_scaffolds ?? [])" :key="i">· {{ s }}</li>
        </ul>
        <div class="text-right mt-6">
          <button class="text-ink hover:underline">submit response →</button>
        </div>
      </template>

      <!-- BareLongAnswer -->
      <template v-else-if="call.scaffold === 'BareLongAnswer'">
        <h2 class="text-h2 text-ink mt-4">{{ call.input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ call.input.setup_prose }}</p>
        <p class="text-body mt-6">{{ call.input.prompt }}</p>
        <textarea rows="9" placeholder="Type your response…"
                  class="w-full mt-4 p-3 border border-ink-subtle bg-surface text-body resize-none focus:outline-none focus:border-accent"></textarea>
        <div class="flex justify-between items-end mt-6">
          <button class="text-ink-subtle text-small hover:underline">Stuck? See examples</button>
          <button class="text-ink hover:underline">submit →</button>
        </div>
      </template>

      <!-- WikiDraft -->
      <template v-else-if="call.scaffold === 'WikiDraft'">
        <h2 class="text-h2 text-ink mt-4">{{ call.input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ call.input.framing_prose }}</p>
        <textarea rows="11" placeholder="Write your entry…"
                  class="w-full mt-4 p-3 border border-ink-subtle bg-surface text-body resize-none focus:outline-none focus:border-accent"></textarea>
        <p class="text-small text-ink-muted mt-4">
          Your response will be reviewed before any other staff sees it. You will be a named contributor.
        </p>
        <div class="text-right mt-4">
          <button class="text-ink hover:underline">submit →</button>
        </div>
      </template>
    </template>
  </section>
</template>

<style>
@keyframes loading {
  from { transform: translateX(-100%); }
  to { transform: translateX(400%); }
}
</style>
