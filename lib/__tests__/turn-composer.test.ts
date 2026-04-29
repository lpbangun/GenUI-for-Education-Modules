// lib/__tests__/turn-composer.test.ts
import { describe, expect, it, mock } from 'bun:test';
import { composeTurn } from '../turn-composer';

describe('composeTurn', () => {
  it('selects tier from mastery and returns a Turn shape', async () => {
    const mockGenerate = mock(async () => ({
      toolCalls: [
        {
          toolName: 'WorkedExample',
          input: {
            title: 'Mock title',
            setup_prose: 'Mock setup.',
            worked_steps: ['Step 1', 'Step 2', 'Step 3'],
            interpretation: 'Mock interpretation.',
          },
        },
      ],
      text: '<terms_surfaced>median, mean</terms_surfaced>\n<dictionary_handoff kind="passive"></dictionary_handoff>',
    }));

    const turn = await composeTurn({
      conceptId: 'central-tendency',
      mastery: 0.10,
      history: [],
      surfacedTerms: [],
      vizDemand: 'distribution',
      _generateText: mockGenerate as any,
    });

    expect(turn.tier).toBe('WorkedExample');
    expect(turn.scaffold.name).toBe('WorkedExample');
    expect(turn.termsSurfaced).toEqual(['median', 'mean']);
    expect(turn.dictionaryHandoff.kind).toBe('passive');
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('falls back to safe defaults when tail blocks are missing', async () => {
    const mockGenerate = mock(async () => ({
      toolCalls: [
        {
          toolName: 'ScaffoldedMCQ',
          input: {
            title: 't', setup_prose: 's', prompt: 'p',
            options: [
              { id: 'A', text: '', correct: true, feedback: '' },
              { id: 'B', text: '', correct: false, feedback: '' },
              { id: 'C', text: '', correct: false, feedback: '' },
            ],
            hint: 'h',
          },
        },
      ],
      text: 'Just prose, no tail blocks.',
    }));

    const turn = await composeTurn({
      conceptId: 'central-tendency',
      mastery: 0.30,
      history: [],
      surfacedTerms: [],
      vizDemand: 'distribution',
      _generateText: mockGenerate as any,
    });

    expect(turn.termsSurfaced).toEqual([]);
    expect(turn.dictionaryHandoff.kind).toBe('passive');
  });

  it('throws if no scaffold tool was called', async () => {
    const mockGenerate = mock(async () => ({
      toolCalls: [],
      text: '',
    }));

    await expect(
      composeTurn({
        conceptId: 'central-tendency',
        mastery: 0.10,
        history: [],
        surfacedTerms: [],
        vizDemand: 'distribution',
        _generateText: mockGenerate as any,
      })
    ).rejects.toThrow(/no scaffold/);
  });

  it('passes the per-tier system prompt for the chosen tier', async () => {
    let capturedSystem = '';
    const mockGenerate = mock(async (args: any) => {
      capturedSystem = args.system;
      return {
        toolCalls: [
          {
            toolName: 'GuidedShortAnswer',
            input: {
              title: 't', setup_prose: 's', prompt: 'p',
              consider_scaffolds: ['claim?', 'support?', 'question?'],
              rubric_primary_criterion: 'r',
            },
          },
        ],
        text: '<terms_surfaced>x</terms_surfaced>\n<dictionary_handoff kind="active" candidate_term="x">Q?</dictionary_handoff>',
      };
    });

    await composeTurn({
      conceptId: 'central-tendency',
      mastery: 0.55,
      history: [],
      surfacedTerms: ['x'],
      vizDemand: 'definition',
      _generateText: mockGenerate as any,
    });

    expect(capturedSystem).toContain('TIER 3 — GuidedShortAnswer');
  });
});
