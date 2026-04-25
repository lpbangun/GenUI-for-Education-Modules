---
id: 002
date: 2026-04-25
feature: F009
type: workaround
---

**What:** Shipped F009 (DictionaryView) with 5 hand-written stub dictionary entries inline in the Vue component instead of reading from `content/dictionary/*.md`. Search via Fuse.js works against the stubs; UI fully functional.

**Why:** F004 (generate 50 dictionary entries) is parked on `GEMINI_API_KEY`. Per HARNESS.md §8, mocking generated content with a hand-written stub when the generator is blocked is an explicitly OK workaround. The frontend needed a populated DictionaryView for F007 e2e to be meaningful.

**Impact on downstream:** When F004 unblocks and generates real entries, the DictionaryView needs a content loader that reads `content/dictionary/*.md` (via `import.meta.glob` or a backend endpoint). The stubs are isolated to one `stubEntries` constant inside `DictionaryView.vue` — a single-file replacement when the time comes. Filed implicitly as part of F004's e2e.

**Reversible:** Yes — replace `stubEntries` with the loader call. Schema fields (`term`, `plain_definition`, `related_terms`) already match `DictionaryEntryFrontmatter`.
