import { test, expect } from 'bun:test';
import { pickScaffold } from '../scaffold-selector';

const empty: any[] = [];

test('mastery 0.00 → WorkedExample (initial floor)', () => {
  expect(pickScaffold({ mastery: 0.00, history: empty })).toBe('WorkedExample');
});
test('mastery 0.10 → WorkedExample (default new-learner state per SPEC.md §6)', () => {
  expect(pickScaffold({ mastery: 0.10, history: empty })).toBe('WorkedExample');
});
test('mastery 0.19 → WorkedExample (just below tier 2 threshold)', () => {
  expect(pickScaffold({ mastery: 0.19, history: empty })).toBe('WorkedExample');
});
test('mastery 0.20 → ScaffoldedMCQ (tier 2 boundary uses ≥)', () => {
  expect(pickScaffold({ mastery: 0.20, history: empty })).toBe('ScaffoldedMCQ');
});
test('mastery 0.44 → ScaffoldedMCQ (just below tier 3)', () => {
  expect(pickScaffold({ mastery: 0.44, history: empty })).toBe('ScaffoldedMCQ');
});
test('mastery 0.45 → GuidedShortAnswer (tier 3 boundary uses ≥)', () => {
  expect(pickScaffold({ mastery: 0.45, history: empty })).toBe('GuidedShortAnswer');
});
test('mastery 0.64 → GuidedShortAnswer (just below tier 4)', () => {
  expect(pickScaffold({ mastery: 0.64, history: empty })).toBe('GuidedShortAnswer');
});
test('mastery 0.65 → BareLongAnswer (tier 4 boundary uses ≥)', () => {
  expect(pickScaffold({ mastery: 0.65, history: empty })).toBe('BareLongAnswer');
});
test('mastery 0.84 → BareLongAnswer (just below tier 5)', () => {
  expect(pickScaffold({ mastery: 0.84, history: empty })).toBe('BareLongAnswer');
});
test('mastery 0.85 → WikiDraft (tier 5 boundary uses ≥)', () => {
  expect(pickScaffold({ mastery: 0.85, history: empty })).toBe('WikiDraft');
});
test('mastery 1.00 → WikiDraft (ceiling)', () => {
  expect(pickScaffold({ mastery: 1.00, history: empty })).toBe('WikiDraft');
});
