<script setup lang="ts">
defineProps<{
  moduleLabel: string;
  lessonTitle: string;
  audience?: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  currentIndex: number;
}>();
</script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[1200px] mx-auto px-12 py-16">
      <div class="text-micro text-ink-subtle uppercase">{{ moduleLabel }}</div>
      <div class="flex items-end justify-between mt-4">
        <h1 class="text-h1 text-ink">{{ lessonTitle }}</h1>
        <div class="flex gap-2 pb-2" aria-label="lesson progress">
          <span
            v-for="i in lessonsTotal"
            :key="i"
            class="w-3 h-3 rounded-full inline-block"
            :class="[
              i <= lessonsCompleted ? 'bg-ink' : '',
              i === currentIndex ? 'border border-ink bg-transparent' : '',
              i > lessonsCompleted && i !== currentIndex ? 'border-0.5 border-ink-subtle' : '',
            ]"
          />
        </div>
      </div>
      <div class="mt-4 border-t-0.5 border-ink-subtle"></div>
      <div class="mt-4 flex justify-between text-small">
        <span v-if="audience" class="text-ink-muted">Adapting to: {{ audience }}</span>
        <span v-else></span>
        <router-link to="/" class="text-ink hover:underline">exit module</router-link>
      </div>

      <main class="mt-12 mb-12">
        <slot />
      </main>

      <footer class="text-small text-ink-muted">
        Stuck on a term?
        <router-link to="/dictionary" class="text-ink hover:underline">See the dictionary</router-link>.
      </footer>
    </div>
  </div>
</template>
