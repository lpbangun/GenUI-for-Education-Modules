<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  flowchart: {
    flowchart_type: 'linear' | 'decision' | 'cycle';
    nodes: Array<{ id: string; label: string; annotation?: string }>;
    edges: Array<{ from: string; to: string; label?: string }>;
    highlight_node_ids?: string[];
    caption: string;
    provenance: string;
  };
}>();

const NODE_W = 140, NODE_H = 56, GAP = 40;
const highlights = computed(() => new Set(props.flowchart.highlight_node_ids ?? []));

const layout = computed(() => {
  const n = props.flowchart.nodes.length;
  if (props.flowchart.flowchart_type === 'cycle') {
    // arrange in a circle
    const cx = 350, cy = 140, r = 100;
    return props.flowchart.nodes.map((node, i) => ({
      ...node,
      x: cx + r * Math.cos((i / n) * 2 * Math.PI - Math.PI / 2) - NODE_W / 2,
      y: cy + r * Math.sin((i / n) * 2 * Math.PI - Math.PI / 2) - NODE_H / 2,
    }));
  }
  // linear / decision: row of boxes
  const totalW = n * NODE_W + (n - 1) * GAP;
  const startX = Math.max(20, (700 - totalW) / 2);
  return props.flowchart.nodes.map((node, i) => ({
    ...node,
    x: startX + i * (NODE_W + GAP),
    y: 50,
  }));
});

const nodeById = computed(() => Object.fromEntries(layout.value.map(n => [n.id, n])));

const W = 700;
const H = computed(() => props.flowchart.flowchart_type === 'cycle' ? 280 : 160);
</script>

<template>
  <figure class="mt-6">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" style="display:block; max-width: 100%;">
      <!-- edges -->
      <g v-for="(e, i) in flowchart.edges" :key="i">
        <template v-if="nodeById[e.from] && nodeById[e.to]">
          <line
            :x1="nodeById[e.from].x + NODE_W"
            :y1="nodeById[e.from].y + NODE_H / 2"
            :x2="nodeById[e.to].x"
            :y2="nodeById[e.to].y + NODE_H / 2"
            stroke="#8B8B8B" stroke-width="0.5"
          />
          <polygon
            :points="`${nodeById[e.to].x},${nodeById[e.to].y + NODE_H / 2} ${nodeById[e.to].x - 6},${nodeById[e.to].y + NODE_H / 2 - 3} ${nodeById[e.to].x - 6},${nodeById[e.to].y + NODE_H / 2 + 3}`"
            fill="#0A0A0A"
          />
          <text v-if="e.label"
                :x="(nodeById[e.from].x + NODE_W + nodeById[e.to].x) / 2"
                :y="nodeById[e.from].y + NODE_H / 2 - 6"
                text-anchor="middle" font-family="Inter" font-size="10" fill="#8B8B8B">
            {{ e.label }}
          </text>
        </template>
      </g>
      <!-- nodes -->
      <g v-for="node in layout" :key="node.id">
        <rect :x="node.x" :y="node.y" :width="NODE_W" :height="NODE_H"
              fill="none"
              :stroke="highlights.has(node.id) ? '#0A0A0A' : '#8B8B8B'"
              :stroke-width="highlights.has(node.id) ? 2 : 1" />
        <text :x="node.x + NODE_W / 2" :y="node.y + (node.annotation ? 24 : 32)"
              text-anchor="middle" font-family="Inter" font-size="13" fill="#0A0A0A">
          {{ node.label.slice(0, 24) }}
        </text>
        <text v-if="node.annotation"
              :x="node.x + NODE_W / 2" :y="node.y + 42"
              text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#8B8B8B">
          {{ node.annotation.slice(0, 16) }}
        </text>
      </g>
    </svg>
    <figcaption class="mt-3">
      <div class="text-small text-ink-muted">{{ flowchart.caption }}</div>
      <div class="text-micro text-ink-subtle uppercase mt-1">{{ flowchart.provenance }}</div>
    </figcaption>
  </figure>
</template>
