// lib/tail-blocks.ts
// Parses <terms_surfaced>...</terms_surfaced> and
// <dictionary_handoff>...</dictionary_handoff> blocks from raw model text.
// Loose, forgiving — missing or malformed blocks fall back to safe defaults.
//
// Per DD-006: no schema gate. Bad output degrades to passive handoff with
// empty term list and is logged by the soft validator, not rejected.

import type { DictionaryHandoff, PassiveHandoff } from './types';
import { SAFE_DEFAULT_HANDOFF } from './types';

export interface TailBlockResult {
  termsSurfaced: string[];
  dictionaryHandoff: DictionaryHandoff;
  cleanedText: string;
}

const TERMS_RE = /<terms_surfaced>([\s\S]*?)<\/terms_surfaced>/i;
const HANDOFF_RE = /<dictionary_handoff([^>]*)>([\s\S]*?)<\/dictionary_handoff>/i;

function parseTermsList(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

function parseAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i');
  const m = attrs.match(re);
  return m ? (m[1] ?? '').trim() || null : null;
}

function parseHandoff(attrs: string, body: string, terms: string[]): DictionaryHandoff {
  const kind = parseAttr(attrs, 'kind');
  if (kind === 'active') {
    const candidate = parseAttr(attrs, 'candidate_term');
    if (!candidate) return { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms };
    return {
      kind: 'active',
      candidateTerm: candidate.toLowerCase(),
      surfacedTerms: terms,
      handoffQuestion: body.trim() || 'Is this how your school uses this term?',
    };
  }
  if (kind === 'constructive') {
    const target = parseAttr(attrs, 'target_term');
    if (!target) return { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms };
    return {
      kind: 'constructive',
      targetTerm: target.toLowerCase(),
      draftTemplate: {
        schoolPlaceholder: 'Your school (e.g., HGSE)',
        howWeUseItPlaceholder: 'How does your team use this term?',
        examplePlaceholder: 'A short example from your work.',
        differsPlaceholder: 'How does this differ from how other schools use it? (optional)',
      },
    };
  }
  // default to passive
  const passive: PassiveHandoff = { kind: 'passive', termsSurfaced: terms };
  return passive;
}

export function parseTailBlocks(text: string): TailBlockResult {
  const termsMatch = text.match(TERMS_RE);
  const handoffMatch = text.match(HANDOFF_RE);

  const terms = termsMatch ? parseTermsList(termsMatch[1] ?? '') : [];
  const handoff = handoffMatch
    ? parseHandoff(handoffMatch[1] ?? '', handoffMatch[2] ?? '', terms)
    : { ...SAFE_DEFAULT_HANDOFF, termsSurfaced: terms };

  let cleanedText = text;
  if (termsMatch) cleanedText = cleanedText.replace(TERMS_RE, '');
  if (handoffMatch) cleanedText = cleanedText.replace(HANDOFF_RE, '');

  return {
    termsSurfaced: terms,
    dictionaryHandoff: handoff,
    cleanedText: cleanedText.trim() ? cleanedText : '',
  };
}
