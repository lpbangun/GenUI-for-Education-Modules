// AI SDK v6 tool definitions. Names match the 5 scaffold component names AND
// the 2 visualization tool names exactly. Drift here breaks rendering — see
// feature_list.json F010 acceptance criteria.

import { z } from 'zod';
import { tool } from 'ai';

// --- Five scaffold tools (one per tier) -------------------------------------

const ScenarioOption = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean(),
  feedback: z.string(),
});

export const scaffoldTools = {
  WorkedExample: tool({
    description: 'Tier 1 scaffold. Use when mastery < 0.20. Renders a fully worked example with comprehension self-report.',
    inputSchema: z.object({
      title: z.string(),
      setup_prose: z.string(),
      worked_steps: z.array(z.string()).min(2),
      interpretation: z.string(),
    }),
    execute: async (input) => ({ scaffold: 'WorkedExample', ...input }),
  }),

  ScaffoldedMCQ: tool({
    description: 'Tier 2 scaffold. Use when 0.20 ≤ mastery < 0.45. Renders MCQ with always-visible hint.',
    inputSchema: z.object({
      title: z.string(),
      setup_prose: z.string(),
      artifact_summary_stats: z.string().optional(),
      observation_prompt: z.string().optional(),
      observation_options: z.array(z.string()).max(4).optional(),
      prompt: z.string(),
      options: z.array(ScenarioOption).min(3).max(4),
      hint: z.string(),
    }),
    execute: async (input) => ({ scaffold: 'ScaffoldedMCQ', ...input }),
  }),

  GuidedShortAnswer: tool({
    description: 'Tier 3 scaffold. Use when 0.45 ≤ mastery < 0.65. Renders short-answer with prompt scaffolds.',
    inputSchema: z.object({
      title: z.string(),
      setup_prose: z.string(),
      prompt: z.string(),
      consider_scaffolds: z.array(z.string()).min(2).max(4),
      rubric_primary_criterion: z.string(),
    }),
    execute: async (input) => ({ scaffold: 'GuidedShortAnswer', ...input }),
  }),

  BareLongAnswer: tool({
    description: 'Tier 4 scaffold. Use when 0.65 ≤ mastery < 0.85. Renders long-answer with no scaffolding.',
    inputSchema: z.object({
      title: z.string(),
      setup_prose: z.string(),
      prompt: z.string(),
      rubric_primary_criterion: z.string(),
    }),
    execute: async (input) => ({ scaffold: 'BareLongAnswer', ...input }),
  }),

  WikiDraft: tool({
    description: 'Tier 5 scaffold. Use when mastery ≥ 0.85. Renders a contributor prompt for the dictionary wiki.',
    inputSchema: z.object({
      title: z.string(),
      framing_prose: z.string(),
      target_dictionary_term: z.string(),
      draft_template_hint: z.string().optional(),
    }),
    execute: async (input) => ({ scaffold: 'WikiDraft', ...input }),
  }),
};

// --- Two visualization tools (per DESIGN.md § Generative-UI) ----------------

export const visualizationTools = {
  render_chart: tool({
    description: 'Render a quantitative chart inside the current scaffold. Use for distributions, group comparisons, time series, or scatter relationships. Must include caption and provenance.',
    inputSchema: z.object({
      chart_type: z.enum(['histogram', 'bar', 'box', 'scatter', 'time_series']),
      dataset_ref: z.string(),
      field_x: z.string().optional(),
      field_y: z.string().optional(),
      highlight_ids: z.array(z.string()).optional(),
      // Inline values for the renderer. Use numbers for histogram/box;
      // {x, y, label?, highlight?} objects for bar/scatter/time_series.
      values: z.array(z.union([
        z.number(),
        z.object({
          x: z.union([z.number(), z.string()]),
          y: z.number().optional(),
          label: z.string().optional(),
          id: z.string().optional(),
          highlight: z.boolean().optional(),
        }),
      ])).min(1),
      caption: z.string().min(1),
      provenance: z.string().min(1),
    }),
    execute: async (input) => ({ visualization: 'chart', ...input }),
  }),

  render_flowchart: tool({
    description: 'Render a sequential or branching flowchart inside the current scaffold. Use for funnels, decision trees, or routine loops. Must include caption and provenance.',
    inputSchema: z.object({
      flowchart_type: z.enum(['linear', 'decision', 'cycle']),
      nodes: z.array(z.object({
        id: z.string(),
        label: z.string().max(24),
        annotation: z.string().max(16).optional(),
      })).min(2).max(6),
      edges: z.array(z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().max(12).optional(),
      })),
      highlight_node_ids: z.array(z.string()).optional(),
      caption: z.string().min(1),
      provenance: z.string().min(1),
    }),
    execute: async (input) => ({ visualization: 'flowchart', ...input }),
  }),
};

export const allTools = { ...scaffoldTools, ...visualizationTools };

// Exported for the F010 reviewer / wiring-agent: the canonical name list.
// If any of these change, update DESIGN.md, feature_list.json F010 acceptance,
// AND the Vue component that renders the matching message.parts.
export const TOOL_NAMES = [
  'WorkedExample',
  'ScaffoldedMCQ',
  'GuidedShortAnswer',
  'BareLongAnswer',
  'WikiDraft',
  'render_chart',
  'render_flowchart',
] as const;
