// lib/db/schema.ts
// Two tables for the dictionary handoff layer (DD-008).
//
// dictionary_handoff_responses captures T3+ active handoff responses.
// wiki_drafts captures T5 constructive handoff submissions. Drafts are NEVER
// auto-published (CLAUDE.md hard rule #4) — status defaults to pending_review.

import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const dictionaryHandoffResponses = pgTable('dictionary_handoff_responses', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  conceptId: text('concept_id').notNull(),
  term: text('term').notNull(),
  schoolSelfReported: text('school_self_reported'),  // HGSE | HBS | FAS | HMS | SEAS | other | null
  agreement: text('agreement').notNull(),             // yes | no | unsure | differently
  freeText: text('free_text'),                        // ≤ 200 chars, PII-tripwire-validated
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const wikiDrafts = pgTable('wiki_drafts', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  term: text('term').notNull(),
  school: text('school').notNull(),
  howWeUseIt: text('how_we_use_it').notNull(),
  exampleInPractice: text('example_in_practice'),
  differsFromOtherSchools: text('differs_from_other_schools'),
  qualityScore: integer('quality_score'),
  status: text('status').notNull().default('pending_review'),  // pending_review | approved | rejected
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type DictionaryHandoffResponse = typeof dictionaryHandoffResponses.$inferSelect;
export type NewDictionaryHandoffResponse = typeof dictionaryHandoffResponses.$inferInsert;

export type WikiDraft = typeof wikiDrafts.$inferSelect;
export type NewWikiDraft = typeof wikiDrafts.$inferInsert;
