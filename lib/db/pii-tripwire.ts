// lib/db/pii-tripwire.ts
// Conservative regex tripwire for learner-submitted free text. Rejects:
// - email addresses
// - salary-like dollar / USD figures
// - student-ID-like 6+ digit sequences
// - "Title FirstName LastName" full-name patterns
// - any string > 200 chars
//
// Per CLAUDE.md hard rule #2 — "Never use real Harvard people, real salary
// data, or real student records." This extends the rule to learner-
// submitted text in dictionary handoff responses.
//
// Tripwire is conservative (false positives over false negatives). On a
// trip the write is dropped silently and a warning is logged by the caller.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const SALARY_RE = /\$\s?\d{1,3}(?:,?\d{3})+(?!\d)|\b\d{4,6}\s?(?:USD|dollars?)\b/i;
const STUDENT_ID_RE = /\b\d{6,}\b/;
const FULL_NAME_RE = /\b(Mr|Ms|Mrs|Dr|Professor|Prof|Dean)\.?\s+[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/;
const BARE_FULL_NAME_RE = /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b(?!\s+(?:School|College|University))/;

export interface TripwireResult {
  ok: boolean;
  reason?: string;
}

export function piiTripwire(text: string): TripwireResult {
  if (text.length > 200) return { ok: false, reason: 'over 200 chars' };
  if (EMAIL_RE.test(text)) return { ok: false, reason: 'email' };
  if (SALARY_RE.test(text)) return { ok: false, reason: 'salary' };
  if (STUDENT_ID_RE.test(text)) return { ok: false, reason: 'student id' };
  if (FULL_NAME_RE.test(text)) return { ok: false, reason: 'titled name' };
  if (BARE_FULL_NAME_RE.test(text)) return { ok: false, reason: 'full name' };
  return { ok: true };
}
