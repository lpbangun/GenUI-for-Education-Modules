// lib/__tests__/tail-blocks.test.ts
import { describe, expect, it } from 'bun:test';
import { parseTailBlocks } from '../tail-blocks';

describe('parseTailBlocks', () => {
  it('parses passive handoff with terms_surfaced only', () => {
    const text = `Some prose.

<terms_surfaced>median, skew</terms_surfaced>
<dictionary_handoff kind="passive">
terms: median, skew
</dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.termsSurfaced).toEqual(['median', 'skew']);
    expect(r.dictionaryHandoff.kind).toBe('passive');
    if (r.dictionaryHandoff.kind === 'passive') {
      expect(r.dictionaryHandoff.termsSurfaced).toEqual(['median', 'skew']);
    }
  });

  it('parses active handoff with candidate_term', () => {
    const text = `<terms_surfaced>median</terms_surfaced>
<dictionary_handoff kind="active" candidate_term="median">
Is this how your school uses this term?
</dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.dictionaryHandoff.kind).toBe('active');
    if (r.dictionaryHandoff.kind === 'active') {
      expect(r.dictionaryHandoff.candidateTerm).toBe('median');
      expect(r.dictionaryHandoff.handoffQuestion).toContain('Is this how');
    }
  });

  it('parses constructive handoff with target_term', () => {
    const text = `<terms_surfaced>median, skew</terms_surfaced>
<dictionary_handoff kind="constructive" target_term="median">
Contribute to the dictionary entry for "median".
</dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.dictionaryHandoff.kind).toBe('constructive');
    if (r.dictionaryHandoff.kind === 'constructive') {
      expect(r.dictionaryHandoff.targetTerm).toBe('median');
    }
  });

  it('returns safe defaults when blocks are missing', () => {
    const text = 'Just prose, no tail blocks.';
    const r = parseTailBlocks(text);
    expect(r.termsSurfaced).toEqual([]);
    expect(r.dictionaryHandoff.kind).toBe('passive');
  });

  it('strips tail blocks from the prose', () => {
    const text = `Visible prose.

<terms_surfaced>x</terms_surfaced>
<dictionary_handoff kind="passive"></dictionary_handoff>`;

    const r = parseTailBlocks(text);
    expect(r.cleanedText.trim()).toBe('Visible prose.');
  });

  it('handles empty terms_surfaced', () => {
    const text = `<terms_surfaced></terms_surfaced>
<dictionary_handoff kind="passive"></dictionary_handoff>`;
    const r = parseTailBlocks(text);
    expect(r.termsSurfaced).toEqual([]);
  });
});
