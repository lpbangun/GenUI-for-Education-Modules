import { describe, expect, it } from 'bun:test';
import { checkTurnCompliance } from '../validate_turn_compliance';
import type { Turn } from '../../lib/types';

const baseTurn = (overrides: Partial<Turn>): Turn => ({
  tier: 'ScaffoldedMCQ',
  conceptId: 'central-tendency',
  mastery: 0.30,
  vizDecision: { kind: 'none', reason: 'test' } as any,
  scaffold: { name: 'ScaffoldedMCQ', input: {} },
  chart: null,
  flowchart: null,
  termsSurfaced: ['median'],
  dictionaryHandoff: { kind: 'passive', termsSurfaced: ['median'] },
  ...overrides,
});

describe('checkTurnCompliance', () => {
  it('passes a well-formed T2 turn', () => {
    const turn = baseTurn({
      scaffold: {
        name: 'ScaffoldedMCQ',
        input: {
          observation_prompt: 'Before answering, what do you notice?',
          options: [
            { id: 'A', text: 'a', correct: true, feedback: 'Picking this means you weighed extreme values heavily — a common interpretation.' },
            { id: 'B', text: 'b', correct: false, feedback: 'This option is reasonable when the data appears symmetric, which is not the case here.' },
            { id: 'C', text: 'c', correct: false, feedback: 'A reader who skims headlines and not the distribution shape might land here.' },
            { id: 'D', text: 'd', correct: false, feedback: 'Plausible if you assumed the outliers were data-entry errors rather than real signal.' },
          ],
        },
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures).toHaveLength(0);
  });

  it('flags T2 missing observation_prompt', () => {
    const turn = baseTurn({
      scaffold: { name: 'ScaffoldedMCQ', input: { options: [], hint: '' } },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('observation_prompt'))).toBe(true);
  });

  it('flags distractor feedback < 12 words', () => {
    const turn = baseTurn({
      scaffold: {
        name: 'ScaffoldedMCQ',
        input: {
          observation_prompt: 'Notice anything?',
          options: [
            { id: 'A', text: 'a', correct: true, feedback: 'Wrong, try again.' },
            { id: 'B', text: 'b', correct: false, feedback: 'Picking this means you weighed extreme values heavily — a common interpretation.' },
            { id: 'C', text: 'c', correct: false, feedback: 'This option is reasonable when the data appears symmetric, which is not the case here.' },
            { id: 'D', text: 'd', correct: false, feedback: 'A reader who skims headlines and not the distribution shape might land here.' },
          ],
        },
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('feedback < 12 words'))).toBe(true);
  });

  it('flags handoff kind mismatched with tier', () => {
    const turn = baseTurn({
      tier: 'WorkedExample',
      scaffold: { name: 'WorkedExample', input: {} },
      dictionaryHandoff: {
        kind: 'active',
        candidateTerm: 'median',
        surfacedTerms: ['median'],
        handoffQuestion: '?',
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('handoff kind'))).toBe(true);
  });

  it('flags T3 missing claim/support/question scaffolds', () => {
    const turn = baseTurn({
      tier: 'GuidedShortAnswer',
      scaffold: {
        name: 'GuidedShortAnswer',
        input: { consider_scaffolds: ['just one'] },
      },
      dictionaryHandoff: {
        kind: 'active',
        candidateTerm: 'median',
        surfacedTerms: ['median'],
        handoffQuestion: '?',
      },
    });
    const r = checkTurnCompliance(turn);
    expect(r.failures.some((f) => f.includes('consider_scaffolds'))).toBe(true);
  });
});
