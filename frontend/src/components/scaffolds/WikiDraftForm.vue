<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ targetTerm: string; sessionId: string; framingProse?: string }>();
const emit = defineEmits<{ submitted: [term: string] }>();

const school = ref<'HGSE' | 'HBS' | 'FAS' | 'HMS' | 'SEAS' | 'other' | null>(null);
const reflection = ref('');
const example = ref('');
const submitting = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);

async function submit() {
  if (!reflection.value.trim()) return;
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
        school: school.value ?? 'other',
        howWeUseIt: reflection.value.trim(),
        exampleInPractice: example.value.trim() || null,
        differsFromOtherSchools: null,
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
  <div class="mt-8">
    <div v-if="!submitted" class="space-y-4">
      <div>
        <label class="text-micro text-ink-subtle uppercase tracking-[0.18em]">
          When does <span class="text-ink">"{{ props.targetTerm }}"</span> come up in your work?
        </label>
        <p class="text-small text-ink-muted mt-2">
          Or — is there a piece of this that still doesn't quite fit how your work actually plays out? Either is welcome.
        </p>
        <textarea
          v-model="reflection"
          rows="4"
          maxlength="200"
          class="w-full mt-3 p-3 border border-ink-subtle bg-paper text-body resize-none focus:outline-none focus:border-accent"
          placeholder="A moment, a meeting, a recurring question. Whatever comes to mind."
        ></textarea>
        <div class="text-micro text-ink-subtle text-right mt-1">{{ reflection.length }}/200</div>
      </div>

      <div class="grid grid-cols-[1fr_180px] gap-6">
        <div>
          <label class="text-micro text-ink-subtle uppercase tracking-[0.18em]">An example, or a question you still have (optional)</label>
          <textarea
            v-model="example"
            rows="2"
            maxlength="200"
            class="w-full mt-2 p-3 border border-ink-subtle bg-paper text-small resize-none focus:outline-none focus:border-accent"
            placeholder="Optional."
          ></textarea>
        </div>
        <div>
          <label class="text-micro text-ink-subtle uppercase tracking-[0.18em]">Your team / department</label>
          <select
            v-model="school"
            class="block w-full mt-2 p-3 border border-ink-subtle bg-paper text-small focus:outline-none focus:border-accent"
          >
            <option :value="null">— select —</option>
            <option value="HGSE">HGSE</option>
            <option value="HBS">HBS</option>
            <option value="FAS">FAS</option>
            <option value="HMS">HMS</option>
            <option value="SEAS">SEAS</option>
            <option value="other">other</option>
          </select>
        </div>
      </div>

      <div class="flex justify-between items-center pt-2 gap-4">
        <span v-if="error" class="text-small" style="color: #c84a4a;">{{ error }}</span>
        <span v-else class="text-micro text-ink-subtle italic">
          The course team reads what learners share here.
        </span>
        <button
          @click="submit"
          :disabled="!reflection.trim() || submitting"
          class="border border-ink py-2 px-6 text-micro text-ink uppercase tracking-[0.18em]
                 hover:bg-ink hover:text-paper transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {{ submitting ? 'sending…' : 'Send →' }}
        </button>
      </div>
    </div>

    <div v-else class="border-l-2 border-accent pl-4 py-3">
      <div class="text-micro text-ink-subtle uppercase tracking-[0.18em]">Sent</div>
      <p class="text-small text-ink mt-2">
        Thanks. Your reflection has been forwarded to the course team.
      </p>
    </div>
  </div>
</template>
