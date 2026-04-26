<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  chart: {
    chart_type: 'histogram' | 'bar' | 'box' | 'scatter' | 'time_series';
    dataset_ref?: string;
    field_x?: string;
    field_y?: string;
    highlight_ids?: string[];
    caption: string;
    provenance: string;
    // Models sometimes return data inline; we accept either declared values or the dataset_ref alone.
    values?: Array<number | { x: number | string; y?: number; label?: string; id?: string; highlight?: boolean }>;
    labels?: string[];
  };
}>();

// Normalize input into a uniform [{x, y, label, highlight}] series.
const series = computed(() => {
  const arr = props.chart.values ?? [];
  const highlights = new Set(props.chart.highlight_ids ?? []);
  return arr.map((v, i) => {
    if (typeof v === 'number') return { x: i, y: v, label: props.chart.labels?.[i] ?? String(i), highlight: false };
    return { x: v.x ?? i, y: v.y ?? (typeof v.x === 'number' ? v.x : 0), label: v.label ?? String(v.x ?? i), highlight: v.highlight ?? (v.id ? highlights.has(v.id) : false) };
  });
});

const W = 480, H = 240, PAD = 36;
const yMax = computed(() => Math.max(...series.value.map(s => Number(s.y)), 1));
const xCount = computed(() => series.value.length || 1);

function bx(i: number) { return PAD + (i / Math.max(xCount.value - 1, 1)) * (W - PAD * 2); }
function by(v: number) { return H - PAD - (v / yMax.value) * (H - PAD * 2); }

const sample = computed(() => series.value.length === 0);
</script>

<template>
  <figure class="mt-6">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" style="display:block; max-width: 100%;">
      <!-- baseline -->
      <line :x1="PAD" :y1="H - PAD" :x2="W - PAD" :y2="H - PAD" stroke="#8B8B8B" stroke-width="0.5" />

      <template v-if="sample">
        <text :x="W/2" :y="H/2" text-anchor="middle" font-family="Inter" font-size="13" fill="#8B8B8B">
          chart_type: {{ chart.chart_type }} · {{ chart.dataset_ref ?? '—' }} (no values returned)
        </text>
      </template>

      <!-- HISTOGRAM / BAR — solid bars from baseline -->
      <template v-else-if="chart.chart_type === 'histogram' || chart.chart_type === 'bar'">
        <rect v-for="(s, i) in series" :key="i"
              :x="bx(i) - 14" :y="by(Number(s.y))" width="28" :height="(H - PAD) - by(Number(s.y))"
              :fill="s.highlight ? '#C8362D' : '#0A0A0A'" />
        <text v-for="(s, i) in series" :key="`l-${i}`"
              :x="bx(i)" :y="H - PAD + 14" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#8B8B8B">
          {{ s.label }}
        </text>
      </template>

      <!-- TIME_SERIES — connected line + dots -->
      <template v-else-if="chart.chart_type === 'time_series'">
        <polyline
          :points="series.map((s, i) => `${bx(i)},${by(Number(s.y))}`).join(' ')"
          fill="none" stroke="#0A0A0A" stroke-width="1" />
        <circle v-for="(s, i) in series" :key="i"
                :cx="bx(i)" :cy="by(Number(s.y))" r="2.5"
                :fill="s.highlight ? '#C8362D' : '#0A0A0A'" />
        <text v-for="(s, i) in series" :key="`l-${i}`"
              v-show="i % Math.ceil(series.length / 6) === 0"
              :x="bx(i)" :y="H - PAD + 14" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#8B8B8B">
          {{ s.label }}
        </text>
      </template>

      <!-- SCATTER — points only -->
      <template v-else-if="chart.chart_type === 'scatter'">
        <circle v-for="(s, i) in series" :key="i"
                :cx="bx(i)" :cy="by(Number(s.y))" r="3"
                :fill="s.highlight ? '#C8362D' : '#0A0A0A'" />
      </template>

      <!-- BOX — single box with whiskers from min/Q1/median/Q3/max if values are sorted -->
      <template v-else-if="chart.chart_type === 'box'">
        <g v-if="series.length >= 5">
          <line :x1="W/2" :y1="by(Number(series[0].y))" :x2="W/2" :y2="by(Number(series[series.length-1].y))" stroke="#0A0A0A" stroke-width="0.5" />
          <rect :x="W/2 - 60"
                :y="by(Number(series[Math.floor(series.length * 0.75)].y))"
                width="120"
                :height="by(Number(series[Math.floor(series.length * 0.25)].y)) - by(Number(series[Math.floor(series.length * 0.75)].y))"
                fill="none" stroke="#0A0A0A" stroke-width="1" />
          <line :x1="W/2 - 60" :x2="W/2 + 60"
                :y1="by(Number(series[Math.floor(series.length / 2)].y))"
                :y2="by(Number(series[Math.floor(series.length / 2)].y))"
                stroke="#C8362D" stroke-width="2" />
        </g>
      </template>
    </svg>
    <figcaption class="mt-3">
      <div class="text-small text-ink-muted">{{ chart.caption }}</div>
      <div class="text-micro text-ink-subtle uppercase mt-1">{{ chart.provenance }}</div>
    </figcaption>
  </figure>
</template>
