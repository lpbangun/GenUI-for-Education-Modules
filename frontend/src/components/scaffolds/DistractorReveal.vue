<script setup lang="ts">
import { ref } from 'vue';

interface Option {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

const props = defineProps<{ options: Option[]; hint: string; observationPrompt?: string }>();
const selectedId = ref<string | null>(null);
const revealed = ref(false);

function pick(id: string) {
  selectedId.value = id;
  revealed.value = true;
}
</script>

<template>
  <div>
    <div v-if="props.observationPrompt" class="bg-paper p-4 border-l-2 border-accent mb-6">
      <div class="text-micro text-ink-subtle uppercase mb-2">Before answering</div>
      <p class="text-small text-ink">{{ props.observationPrompt }}</p>
    </div>

    <div class="space-y-3">
      <button
        v-for="opt in props.options"
        :key="opt.id"
        @click="pick(opt.id)"
        :class="[
          'w-full text-left border p-4 transition cursor-pointer',
          selectedId === opt.id
            ? (opt.correct ? 'border-tier-3 bg-tier-3/5' : 'border-tier-1 bg-tier-1/5')
            : 'border-ink-subtle hover:border-ink',
        ]"
      >
        <div class="flex">
          <span class="font-mono text-small text-ink-subtle mr-3">{{ opt.id }}</span>
          <span class="text-body">{{ opt.text }}</span>
        </div>
        <Transition name="reveal">
          <div v-if="revealed" class="mt-3 text-small text-ink-muted border-t border-ink-subtle/30 pt-3">
            <span class="font-mono text-micro uppercase mr-2">why someone picks this:</span>
            {{ opt.feedback }}
          </div>
        </Transition>
      </button>
    </div>

    <div class="mt-6" style="width:48px; border-top: 0.5px solid #8B8B8B;"></div>
    <div class="text-micro text-ink-subtle uppercase mt-6">Hint</div>
    <p class="text-small text-ink-muted mt-2">{{ props.hint }}</p>
  </div>
</template>

<style scoped>
.reveal-enter-active { transition: opacity 0.4s ease, max-height 0.4s ease; }
.reveal-enter-from { opacity: 0; max-height: 0; }
.reveal-enter-to { opacity: 1; max-height: 200px; }
</style>
