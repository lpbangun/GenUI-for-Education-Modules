<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DictionaryHandoff } from '../../lib/api';

const props = defineProps<{
  handoff: DictionaryHandoff;
  conceptId: string;
  sessionId: string;
}>();

const emit = defineEmits<{ submitted: [term: string] }>();

const agreement = ref<'yes' | 'no' | 'unsure' | 'differently' | null>(null);
const freeText = ref('');
const school = ref<'HGSE' | 'HBS' | 'FAS' | 'HMS' | 'SEAS' | 'other' | null>(null);
const submitting = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);

const candidateTerm = computed(() => {
  if (props.handoff.kind === 'active') return props.handoff.candidateTerm ?? null;
  return null;
});

async function submit() {
  if (!candidateTerm.value || !agreement.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE
      ?? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/_/backend');
    const res = await fetch(`${BACKEND_BASE}/api/handoff/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: props.sessionId,
        conceptId: props.conceptId,
        term: candidateTerm.value,
        schoolSelfReported: school.value,
        agreement: agreement.value,
        freeText: freeText.value.trim() || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      error.value = j.error ?? `HTTP ${res.status}`;
      return;
    }
    submitted.value = true;
    emit('submitted', candidateTerm.value);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Transition name="slide">
    <div v-if="props.handoff.kind === 'active' && candidateTerm" class="border border-accent bg-accent-tint p-6 mt-8">
      <div class="text-micro text-ink-subtle uppercase">One quick check</div>
      <p class="text-body text-ink mt-2">
        How does <strong>your team</strong> use the word "{{ candidateTerm }}"?
      </p>

      <div v-if="!submitted" class="mt-4 space-y-2">
        <label class="block cursor-pointer text-small">
          <input type="radio" name="agreement" value="yes" v-model="agreement" class="mr-2 accent-ink" />
          Same as the course team note
        </label>
        <label class="block cursor-pointer text-small">
          <input type="radio" name="agreement" value="differently" v-model="agreement" class="mr-2 accent-ink" />
          We use it differently
        </label>
        <label class="block cursor-pointer text-small">
          <input type="radio" name="agreement" value="unsure" v-model="agreement" class="mr-2 accent-ink" />
          Not sure
        </label>

        <div v-if="agreement === 'differently'" class="mt-4">
          <label class="text-micro text-ink-subtle uppercase">Your school</label>
          <select v-model="school" class="block mt-1 p-2 border border-ink-subtle bg-surface text-small">
            <option :value="null">— select —</option>
            <option value="HGSE">HGSE</option>
            <option value="HBS">HBS</option>
            <option value="FAS">FAS</option>
            <option value="HMS">HMS</option>
            <option value="SEAS">SEAS</option>
            <option value="other">other</option>
          </select>
          <label class="text-micro text-ink-subtle uppercase mt-3 block">How does your team use it? (optional)</label>
          <textarea v-model="freeText" rows="2" maxlength="200"
                    class="w-full mt-1 p-2 border border-ink-subtle bg-surface text-small resize-none focus:outline-none focus:border-accent"></textarea>
          <div class="text-micro text-ink-subtle text-right mt-1">{{ freeText.length }}/200</div>
        </div>

        <div class="mt-4 flex justify-between items-center">
          <span v-if="error" class="text-small text-tier-1">{{ error }}</span>
          <button @click="submit" :disabled="!agreement || submitting"
                  class="text-ink hover:underline disabled:opacity-40">
            {{ submitting ? 'submitting…' : 'submit →' }}
          </button>
        </div>
      </div>

      <div v-else class="mt-4 text-small text-ink-muted">
        Thank you. Your input helps build the cross-school dictionary.
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-enter-from { opacity: 0; transform: translateY(8px); }
</style>
