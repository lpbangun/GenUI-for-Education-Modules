// lib/db/wiki-repo.ts
import { desc } from 'drizzle-orm';
import { getDb, schema } from './client';
import { piiTripwire } from './pii-tripwire';

export interface WikiDraftSubmission {
  sessionId: string;
  term: string;
  school: string;
  howWeUseIt: string;
  exampleInPractice: string | null;
  differsFromOtherSchools: string | null;
}

export interface WikiSubmitResult {
  ok: boolean;
  reason?: string;
  id?: number;
}

export async function submitWikiDraft(input: WikiDraftSubmission): Promise<WikiSubmitResult> {
  for (const [field, value] of [
    ['howWeUseIt', input.howWeUseIt],
    ['exampleInPractice', input.exampleInPractice],
    ['differsFromOtherSchools', input.differsFromOtherSchools],
  ] as const) {
    if (!value) continue;
    const t = piiTripwire(value);
    if (!t.ok) {
      console.warn(`wiki draft ${field} tripwire: ${t.reason}`);
      return { ok: false, reason: `${field}: ${t.reason}` };
    }
  }

  const db = getDb();
  if (!db) {
    console.warn('DATABASE_URL not set — wiki draft write skipped');
    return { ok: true };
  }

  const [row] = await db
    .insert(schema.wikiDrafts)
    .values({
      sessionId: input.sessionId,
      term: input.term.toLowerCase(),
      school: input.school,
      howWeUseIt: input.howWeUseIt,
      exampleInPractice: input.exampleInPractice,
      differsFromOtherSchools: input.differsFromOtherSchools,
      // status defaults to pending_review per schema; never auto-publish.
    })
    .returning({ id: schema.wikiDrafts.id });

  return { ok: true, id: row.id };
}

export async function listPendingDrafts(limit = 50) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(schema.wikiDrafts)
    .orderBy(desc(schema.wikiDrafts.createdAt))
    .limit(limit);
}
