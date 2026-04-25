<script setup lang="ts">
import { ref, computed } from 'vue';
import Fuse from 'fuse.js';

// Placeholder content until F004 generates real entries. Real dictionary data
// will be loaded from /content/dictionary/*.md via a build-time import or a
// backend endpoint in F009.
const stubEntries = [
  { term: 'median', plain_definition: 'The middle value when a set of numbers is sorted.', related_terms: ['mean', 'mode'] },
  { term: 'mean', plain_definition: 'The arithmetic average; sum divided by count.', related_terms: ['median', 'outlier'] },
  { term: 'outlier', plain_definition: 'A value far from the rest of the distribution.', related_terms: ['skew', 'mean'] },
  { term: 'skew', plain_definition: 'The asymmetry of a distribution.', related_terms: ['median', 'distribution'] },
  { term: 'distribution', plain_definition: 'How values in a dataset are spread out.', related_terms: ['skew', 'variability'] },
];

const props = defineProps<{ term?: string }>();
const query = ref('');

const fuse = new Fuse(stubEntries, {
  keys: ['term', 'plain_definition', 'related_terms'],
  threshold: 0.4,
});

const visible = computed(() => {
  if (!query.value.trim()) return stubEntries;
  return fuse.search(query.value).map(r => r.item);
});

const selected = computed(() => {
  const id = props.term ?? visible.value[0]?.term ?? 'median';
  return stubEntries.find(e => e.term === id) ?? stubEntries[0];
});
</script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[1200px] mx-auto px-12 py-16">
      <div class="text-micro text-ink-subtle uppercase">Dictionary · {{ stubEntries.length }} terms (stub — F004 will populate)</div>
      <div class="grid grid-cols-8 gap-6 mt-12">
        <aside class="col-span-3">
          <div class="border-b border-ink-subtle pb-2">
            <input
              v-model="query"
              type="text"
              placeholder="Search terms…"
              class="w-full text-small bg-transparent outline-none placeholder:text-ink-subtle"
              aria-label="search"
            />
          </div>
          <ul class="mt-6 space-y-3 text-small">
            <li v-for="entry in visible" :key="entry.term">
              <router-link
                :to="`/dictionary/${entry.term}`"
                class="block"
                :class="entry.term === selected.term ? 'text-ink pl-3 border-l-2 border-ink' : 'text-ink-muted'"
              >
                {{ entry.term }}
              </router-link>
            </li>
          </ul>
        </aside>
        <div class="col-span-5">
          <h2 class="text-h2 text-ink">{{ selected.term }}</h2>
          <p class="text-body text-ink-muted mt-2">{{ selected.plain_definition }}</p>

          <div class="mt-12 text-micro text-ink-subtle uppercase">Related</div>
          <p class="text-small text-ink mt-2">
            <template v-for="(t, i) in selected.related_terms" :key="t">
              <router-link :to="`/dictionary/${t}`" class="text-ink hover:underline">{{ t }}</router-link>
              <span v-if="i < selected.related_terms.length - 1" class="text-ink-subtle"> · </span>
            </template>
          </p>

          <div class="mt-12 pt-6 border-t-0.5 border-ink-subtle">
            <div class="text-micro text-ink-subtle uppercase">Contributed by staff (Tier 5 wiki drafts will appear here)</div>
            <p class="text-small text-ink-muted mt-3">
              No contributions yet. As learners reach Tier 5 and submit wiki drafts, they will be
              displayed in this section with a "user-generated" badge per SPEC.md §7.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
