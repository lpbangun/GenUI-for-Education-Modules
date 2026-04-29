// lib/db/__tests__/pii-tripwire.test.ts
import { describe, expect, it } from 'bun:test';
import { piiTripwire } from '../pii-tripwire';

describe('piiTripwire', () => {
  it('passes clean academic-style prose', () => {
    expect(piiTripwire('We use median when distributions are skewed.')).toEqual({ ok: true });
  });

  it('rejects email addresses', () => {
    const r = piiTripwire('Contact j.smith@harvard.edu for details.');
    expect(r.ok).toBe(false);
  });

  it('rejects salary-like figures', () => {
    expect(piiTripwire('She earns $145,000 a year.').ok).toBe(false);
    expect(piiTripwire('Salary: 145000 USD').ok).toBe(false);
  });

  it('rejects student ID-like sequences', () => {
    expect(piiTripwire('Student 12345678 dropped the course.').ok).toBe(false);
  });

  it('rejects strings over 200 chars', () => {
    const long = 'a'.repeat(201);
    expect(piiTripwire(long).ok).toBe(false);
  });

  it('rejects full-name patterns (Title Case First Last)', () => {
    expect(piiTripwire('Professor Jane Doe teaches this course.').ok).toBe(false);
  });

  it('passes single capitalized words (school names)', () => {
    expect(piiTripwire('At HGSE we use it slightly differently.').ok).toBe(true);
  });
});
