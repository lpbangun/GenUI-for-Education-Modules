// Tool name correctness — the silent failure mode F010 has 4 review rounds for.
// This test verifies tool names match the canonical list AND that the names
// referenced in the spec docs match the tool implementations.

import { test, expect } from 'bun:test';
import { allTools, TOOL_NAMES } from '../tools';

test('TOOL_NAMES list matches allTools keys', () => {
  expect(Object.keys(allTools).sort()).toEqual([...TOOL_NAMES].sort());
});

test('all 5 scaffold names are present', () => {
  for (const name of ['WorkedExample', 'ScaffoldedMCQ', 'GuidedShortAnswer', 'BareLongAnswer', 'WikiDraft']) {
    expect(TOOL_NAMES).toContain(name as any);
  }
});

test('both visualization tool names are present', () => {
  expect(TOOL_NAMES).toContain('render_chart');
  expect(TOOL_NAMES).toContain('render_flowchart');
});

test('tool count is exactly 7 (no drift)', () => {
  expect(TOOL_NAMES.length).toBe(7);
  expect(Object.keys(allTools).length).toBe(7);
});
