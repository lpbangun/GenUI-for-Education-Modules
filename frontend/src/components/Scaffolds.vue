<script setup lang="ts">
import { computed } from 'vue';
import type { ScaffoldResult } from '../lib/api';
import { TIER_COLORS } from '../lib/api';
import RenderedChart from './RenderedChart.vue';
import RenderedFlowchart from './RenderedFlowchart.vue';
import DistractorReveal from './scaffolds/DistractorReveal.vue';

const props = defineProps<{ result: ScaffoldResult | null; loading?: boolean }>();

const tierNum = computed(() => {
  switch (props.result?.scaffold?.name) {
    case 'WorkedExample': return 1;
    case 'ScaffoldedMCQ': return 2;
    case 'GuidedShortAnswer': return 3;
    case 'BareLongAnswer': return 4;
    case 'WikiDraft': return 5;
    default: return 0;
  }
});

const tierColor = computed(() => props.result?.scaffold ? TIER_COLORS[props.result.scaffold.name] : 'bg-ink-subtle');
const sc = computed(() => props.result?.scaffold);
const input = computed(() => sc.value?.input ?? {});
</script>

<template>
  <section class="bg-surface p-8" v-if="loading || result?.scaffold">
    <div class="h-0.5 w-8" :class="tierColor"></div>

    <div v-if="loading" class="mt-6">
      <div class="text-micro text-ink-subtle uppercase">Generating scaffold…</div>
      <div class="mt-4 h-0.5 w-full bg-overlay overflow-hidden">
        <div class="h-0.5 bg-accent animate-[loading_1.5s_linear_infinite] w-1/3"></div>
      </div>
    </div>

    <template v-else-if="sc">
      <div class="text-micro text-ink-subtle uppercase mt-6">
        Tier {{ tierNum }} · {{ sc.name }}
      </div>

      <!-- WorkedExample -->
      <template v-if="sc.name === 'WorkedExample'">
        <h2 class="text-h2 text-ink mt-4">{{ input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ input.setup_prose }}</p>
        <RenderedChart v-if="result?.chart" :chart="result.chart" />
        <RenderedFlowchart v-if="result?.flowchart" :flowchart="result.flowchart" />
        <ol class="mt-6 space-y-3 list-decimal pl-6">
          <li v-for="(step, i) in (input.worked_steps ?? [])" :key="i" class="text-body">{{ step }}</li>
        </ol>
        <p class="text-body mt-6 whitespace-pre-line">{{ input.interpretation }}</p>
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
      <template v-else-if="sc.name === 'ScaffoldedMCQ'">
        <h2 class="text-h2 text-ink mt-4">{{ input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ input.setup_prose }}</p>
        <pre v-if="input.artifact_summary_stats"
             class="font-mono text-small mt-4 p-4 bg-accent-tint whitespace-pre-line">{{ input.artifact_summary_stats }}</pre>
        <RenderedChart v-if="result?.chart" :chart="result.chart" />
        <RenderedFlowchart v-if="result?.flowchart" :flowchart="result.flowchart" />
        <p class="text-body mt-6">{{ input.prompt }}</p>
        <DistractorReveal class="mt-4"
                          :options="input.options ?? []"
                          :hint="input.hint ?? ''"
                          :observation-prompt="input.observation_prompt" />
      </template>

      <!-- GuidedShortAnswer -->
      <template v-else-if="sc.name === 'GuidedShortAnswer'">
        <h2 class="text-h2 text-ink mt-4">{{ input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ input.setup_prose }}</p>
        <RenderedChart v-if="result?.chart" :chart="result.chart" />
        <RenderedFlowchart v-if="result?.flowchart" :flowchart="result.flowchart" />
        <p class="text-body mt-6">{{ input.prompt }}</p>
        <textarea rows="5" placeholder="Type your response…"
                  class="w-full mt-4 p-3 border border-ink-subtle bg-surface text-body resize-none focus:outline-none focus:border-accent"></textarea>
        <div class="text-micro text-ink-subtle uppercase mt-6">Consider</div>
        <ul class="text-small text-ink-muted mt-2 space-y-2">
          <li v-for="(s, i) in (input.consider_scaffolds ?? [])" :key="i">· {{ s }}</li>
        </ul>
        <div class="text-right mt-6">
          <button class="text-ink hover:underline">submit response →</button>
        </div>
      </template>

      <!-- BareLongAnswer -->
      <template v-else-if="sc.name === 'BareLongAnswer'">
        <h2 class="text-h2 text-ink mt-4">{{ input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ input.setup_prose }}</p>
        <RenderedChart v-if="result?.chart" :chart="result.chart" />
        <RenderedFlowchart v-if="result?.flowchart" :flowchart="result.flowchart" />
        <p class="text-body mt-6">{{ input.prompt }}</p>
        <textarea rows="9" placeholder="Type your response…"
                  class="w-full mt-4 p-3 border border-ink-subtle bg-surface text-body resize-none focus:outline-none focus:border-accent"></textarea>
        <div class="flex justify-between items-end mt-6">
          <button class="text-ink-subtle text-small hover:underline">Stuck? See examples</button>
          <button class="text-ink hover:underline">submit →</button>
        </div>
      </template>

      <!-- WikiDraft — the actual reflection form is rendered by WikiDraftForm in the parent view. -->
      <template v-else-if="sc.name === 'WikiDraft'">
        <h2 class="text-h2 text-ink mt-4">{{ input.title }}</h2>
        <p class="text-body mt-6 whitespace-pre-line">{{ input.framing_prose }}</p>
        <RenderedChart v-if="result?.chart" :chart="result.chart" />
        <RenderedFlowchart v-if="result?.flowchart" :flowchart="result.flowchart" />
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
