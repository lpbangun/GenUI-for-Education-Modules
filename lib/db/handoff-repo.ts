// lib/db/handoff-repo.ts
import { eq, desc, and } from 'drizzle-orm';
import { getDb, schema } from './client';
import { piiTripwire } from './pii-tripwire';

const SCHOOLS = ['HGSE', 'HBS', 'FAS', 'HMS', 'SEAS', 'other'] as const;
type School = typeof SCHOOLS[number];

const AGREEMENTS = ['yes', 'no', 'unsure', 'differently'] as const;
type Agreement = typeof AGREEMENTS[number];

export interface HandoffSubmission {
  sessionId: string;
  conceptId: string;
  term: string;
  schoolSelfReported: School | null;
  agreement: Agreement;
  freeText: string | null;
}

export interface SubmitResult {
  ok: boolean;
  reason?: string;
  id?: number;
}

export async function submitHandoff(input: HandoffSubmission): Promise<SubmitResult> {
  if (!AGREEMENTS.includes(input.agreement)) {
    return { ok: false, reason: 'invalid agreement' };
  }
  if (input.schoolSelfReported && !SCHOOLS.includes(input.schoolSelfReported)) {
    return { ok: false, reason: 'invalid school' };
  }
  let cleanedText: string | null = null;
  if (input.freeText) {
    const t = piiTripwire(input.freeText);
    if (!t.ok) {
      console.warn(`handoff free_text dropped: ${t.reason}`);
      cleanedText = null;
    } else {
      cleanedText = input.freeText;
    }
  }

  const db = getDb();
  if (!db) {
    console.warn('DATABASE_URL not set — handoff write skipped');
    return { ok: true };  // soft-success in dev
  }

  const [row] = await db
    .insert(schema.dictionaryHandoffResponses)
    .values({
      sessionId: input.sessionId,
      conceptId: input.conceptId,
      term: input.term.toLowerCase(),
      schoolSelfReported: input.schoolSelfReported,
      agreement: input.agreement,
      freeText: cleanedText,
    })
    .returning({ id: schema.dictionaryHandoffResponses.id });

  return { ok: true, id: row.id };
}

export async function recentDivergent(term: string, limit = 3) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(schema.dictionaryHandoffResponses)
    .where(
      and(
        eq(schema.dictionaryHandoffResponses.term, term.toLowerCase()),
        eq(schema.dictionaryHandoffResponses.agreement, 'differently')
      )
    )
    .orderBy(desc(schema.dictionaryHandoffResponses.createdAt))
    .limit(limit);
}
