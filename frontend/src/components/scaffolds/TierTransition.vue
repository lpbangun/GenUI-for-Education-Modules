<script setup lang="ts">
import { computed } from 'vue';
import type { ScaffoldName } from '../../lib/api';

const props = defineProps<{ from: ScaffoldName | null; to: ScaffoldName }>();

const TIER_LABEL: Record<ScaffoldName, string> = {
  WorkedExample: 'demonstration',
  ScaffoldedMCQ: 'scaffolded recognition',
  GuidedShortAnswer: 'guided interpretation',
  BareLongAnswer: 'unscaffolded reasoning',
  WikiDraft: 'contribution',
};

const message = computed(() => {
  if (!props.from || props.from === props.to) return null;
  return `You've moved from ${TIER_LABEL[props.from]} to ${TIER_LABEL[props.to]}.`;
});
</script>

<template>
  <Transition name="fade">
    <div v-if="message" class="bg-accent-tint p-4 mb-6 text-small text-ink">
      {{ message }} The scaffolding will be lighter from here.
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
