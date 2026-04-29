<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ targetTerm: string; sessionId: string }>();
const emit = defineEmits<{ submitted: [term: string] }>();

const school = ref<'HGSE' | 'HBS' | 'FAS' | 'HMS' | 'SEAS' | 'other' | null>(null);
const howWeUseIt = ref('');
const example = ref('');
const differs = ref('');
const submitting = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);

async function submit() {
  if (!school.value || !howWeUseIt.value.trim()) return;
  submitting.value = true;
  error.value = null;
  try {
    const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE
      ?? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/_/backend');
    const res = await fetch(`${BACKEND_BASE}/api/wiki-draft/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: props.sessionId,
        term: props.targetTerm,
        school: school.value,
        howWeUseIt: howWeUseIt.value.trim(),
        exampleInPractice: example.value.trim() || null,
        differsFromOtherSchools: differs.value.trim() || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      error.value = j.error ?? `HTTP ${res.status}`;
      return;
    }
    submitted.value = true;
    emit('submitted', props.targetTerm);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="bg-surface p-6 mt-8 border border-ink-subtle">
    <div class="text-micro text-ink-subtle uppercase">Contribute: "{{ props.targetTerm }}"</div>
    <p class="text-small text-ink-muted mt-2">
      Your draft goes to human review before appearing in the dictionary. Thank you for contributing.
    </p>

    <div v-if="!submitted" class="mt-4 space-y-3">
      <div>
        <label class="text-micro text-ink-subtle uppercase">Your school</label>
        <select v-model="school" class="block mt-1 p-2 border border-ink-subtle bg-paper text-small">
          <option :value="null">— select —</option>
          <option value="HGSE">HGSE</option>
          <option value="HBS">HBS</option>
          <option value="FAS">FAS</option>
          <option value="HMS">HMS</option>
          <option value="SEAS">SEAS</option>
          <option value="other">other</option>
        </select>
      </div>
      <div>
        <label class="text-micro text-ink-subtle uppercase">How your team uses "{{ props.targetTerm }}"</label>
        <textarea v-model="howWeUseIt" rows="3" maxlength="200"
                  class="w-full mt-1 p-2 border border-ink-subtle bg-paper text-small resize-none focus:outline-none focus:border-accent"
                  placeholder="A short description in your own words."></textarea>
        <div class="text-micro text-ink-subtle text-right">{{ howWeUseIt.length }}/200</div>
      </div>
      <div>
        <label class="text-micro text-ink-subtle uppercase">A short example from your work (optional)</label>
        <textarea v-model="example" rows="2" maxlength="200"
                  class="w-full mt-1 p-2 border border-ink-subtle bg-paper text-small resize-none focus:outline-none focus:border-accent"></textarea>
      </div>
      <div>
        <label class="text-micro text-ink-subtle uppercase">How this differs from how other schools use it (optional)</label>
        <textarea v-model="differs" rows="2" maxlength="200"
                  class="w-full mt-1 p-2 border border-ink-subtle bg-paper text-small resize-none focus:outline-none focus:border-accent"></textarea>
      </div>
      <div class="flex justify-between items-center pt-2">
        <span v-if="error" class="text-small text-tier-1">{{ error }}</span>
        <button @click="submit" :disabled="!school || !howWeUseIt.trim() || submitting"
                class="text-ink hover:underline disabled:opacity-40">
          {{ submitting ? 'submitting…' : 'submit draft →' }}
        </button>
      </div>
    </div>

    <div v-else class="mt-4 text-small text-ink-muted">
      Your draft has been queued for review.
    </div>
  </div>
</template>
