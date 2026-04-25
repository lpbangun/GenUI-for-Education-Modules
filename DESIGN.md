# DESIGN.md

This file is the project's design system. CLAUDE.md tells agents how to build, SPEC.md tells them what to build, DESIGN.md tells them **what it should look like**. All three documents are authoritative; if they conflict, escalate to a human via `needs_human_input: true`.

The aesthetic is Swiss minimalism — rigorous grid, restrained typography, generous whitespace, structural color. Reference points: Massimo Vignelli's NYC subway signage, Müller-Brockmann's grids, Anton Stankowski's diagrams, Kinfolk's editorial restraint. Anti-references: gradient-heavy SaaS dashboards, glassmorphism, neumorphism, decorative illustrations, emoji-as-UI.

When in doubt: remove decoration. The interface should disappear into the content.

---

## 1. Design principles

The five principles, in priority order. When a design decision conflicts between two principles, the higher one wins.

1. **Content is the figure, the interface is the ground.** Type, data, and prose carry the page. Chrome (borders, shadows, decoration) recedes.
2. **Structure is visible through alignment, not through borders.** Use the grid and whitespace to imply structure. Use lines only when alignment alone is ambiguous.
3. **Color is structural, not decorative.** Color signals tier transitions, validation states, and interactive affordances. It does not "brighten" the page.
4. **Type does the work of hierarchy.** Three weights, two sizes per zone, generous line-height. No ALL CAPS for emphasis (only for micro-labels).
5. **Interactions are quiet.** No bouncy easings, no shimmering placeholders, no spring physics. 150ms cubic-bezier(0.4, 0.0, 0.2, 1).

## 2. Color system

A restricted palette. Eight tokens, no others. The palette is deliberately narrow — Swiss design uses one or two accent colors, not a "full spectrum."

```css
/* Tailwind config — these become the only color classes used in the app */

/* Surface */
--color-paper:        #FAFAF8;  /* page background — warm off-white, never pure */
--color-surface:      #FFFFFF;  /* cards, content blocks */
--color-overlay:      #F2F2EE;  /* secondary surfaces, hover states */

/* Type */
--color-ink:          #0A0A0A;  /* primary text — near-black, never pure black */
--color-ink-muted:    #5C5C5C;  /* secondary text */
--color-ink-subtle:   #8B8B8B;  /* tertiary text, captions */

/* Structural accent */
--color-accent:       #C8362D;  /* the one accent — used for tier transitions, focus, key emphasis */
--color-accent-tint:  #FBE8E6;  /* accent at ~10% — backgrounds for tier-1 worked examples */
```

Notes on the palette:

- The accent red is single-purpose. It marks the **active scaffold tier** in the breadcrumb, **focus rings** on inputs, **incorrect-answer feedback**, and the **call-to-action** button. It does not appear elsewhere. This is what makes it readable as a signal.
- There is no "secondary" or "tertiary" color. If a designer reaches for one, they should use ink-muted or overlay instead.
- Validation states are conveyed by **typography and position**, not color: a wrong answer's feedback appears below the option in ink-muted; a correct one in ink with a single thin underline. Green and yellow status colors are explicitly out.

### Tier colors (the one exception)

Each scaffold tier gets a single muted backdrop tint, applied only as a 1px top border on the scaffold container. This is the only place tier color appears.

```css
--tier-1-mark: #C8362D;  /* WorkedExample — accent, this is the most-supported tier */
--tier-2-mark: #8B6F47;  /* ScaffoldedMCQ — warm ink */
--tier-3-mark: #4A6B47;  /* GuidedShortAnswer — cool ink */
--tier-4-mark: #3D4A6B;  /* BareLongAnswer — deeper cool */
--tier-5-mark: #0A0A0A;  /* WikiDraft — ink, the most-independent tier */
```

The progression from accent → warm → cool → ink mirrors the fade. As scaffolding retreats, color retreats.

## 3. Typography

Two typefaces. No third.

```css
--font-display: 'Inter', 'Helvetica Neue', Arial, sans-serif;
--font-mono:    'JetBrains Mono', 'Menlo', 'Consolas', monospace;
```

Inter is the workhorse for everything that is not code, data, or numbers in tables. JetBrains Mono is for code blocks, dataset rows, and tabular numerals.

### Type ramp

Six sizes. Memorize them. Do not interpolate.

| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `text-display` | 48px / 56px | 500 | -0.02em | Module title page (rare) |
| `text-h1` | 32px / 40px | 500 | -0.01em | Lesson title |
| `text-h2` | 24px / 32px | 500 | -0.005em | Section headings within a scaffold |
| `text-body` | 16px / 28px | 400 | 0 | Default prose |
| `text-small` | 14px / 22px | 400 | 0 | Hints, secondary content |
| `text-micro` | 11px / 16px | 500 | 0.08em uppercase | Eyebrow labels, micro-metadata |

Three weights only: 400 (regular), 500 (medium), and 600 (semibold) — the last reserved for `<strong>` within prose. No 300, no 700, no italic-as-emphasis (italic is allowed only for citations and proper-noun titles).

Line-height of 28px on 16px body type is generous on purpose. Swiss-style readability is a function of line-height and measure, not font size.

### Measure

Body prose lives in a column 60-72 characters wide. On a 1280px viewport, that's roughly 600px max-width. Wider columns are visually heavier and reduce reading speed. Charts and data tables can break out to the full grid; prose cannot.

## 4. Grid and spacing

A 12-column grid with 24px gutters on a 1280px max-width container. The module content lives in an 8-column inset; the dictionary popover and metadata sit in the remaining 4 columns or as overlays.

### Spacing scale

Eight values. Multiples of 4px. No exceptions.

| Token | Pixels | Use |
|---|---|---|
| `space-1` | 4px | Inline icon-text gap, micro-spacing |
| `space-2` | 8px | Pill padding, tight inline groups |
| `space-3` | 12px | Default inline spacing |
| `space-4` | 16px | Default block spacing within components |
| `space-6` | 24px | Section spacing within a scaffold |
| `space-8` | 32px | Between scaffolds and dictionary |
| `space-12` | 48px | Between major regions of the page |
| `space-16` | 64px | Page-level top padding |

A scaffold component is bounded by `space-12` above and below. Within it, sections are separated by `space-6`. Within sections, blocks by `space-4`. Within blocks, inline by `space-3`.

### Vertical rhythm

A 4px baseline grid. Every line of text and every component edge must align to a 4px grid line. Inter at 16px / 28px line-height respects this. JetBrains Mono at 13px / 20px respects this.

## 5. Component anatomies

Specifications for the seven most-used components. Each spec includes structural rules; visual rules in the design tokens above.

### LMSShell

The outermost wrapper. Renders on every module page.

```
┌────────────────────────────────────────────────────────┐
│  Module 3 of 7 · Data fluency for higher ed admin       │  ← micro label, ink-subtle
│                                                          │
│  Reading distributions in context              ●●●○○○○  │  ← h1 + progress dots
│  ──────────────────────────────────────────────────     │  ← thin (0.5px) ink-muted divider
│                                                          │
│  Adapting to: HGSE career consultant   [exit module]    │  ← small + small text-link, justified
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [scaffold component renders here]                │  │
│  │                                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Stuck on a term? See the dictionary.                    │  ← small, ink-muted, footer
└────────────────────────────────────────────────────────┘
```

Specifications:
- Page padding: `space-16` top, `space-12` sides on desktop, `space-6` on mobile.
- Progress is shown as filled circles, not a bar. One circle per lesson. Filled = complete, ringed = current, empty = upcoming. Do not animate the fill.
- Module/lesson breadcrumb uses `text-micro` with separator " · " (Unicode middle dot, not slash).
- Title is `text-h1`, no subtitle.
- The horizontal divider below the title is 0.5px (use `border-width: 0.5px` directly, not Tailwind's `border`), color `ink-subtle` at full opacity.
- "Exit module" is a text-link, not a button. Underlined on hover only.

### Scaffold container (the parent of all five tier components)

```
┌──────────────────────────────────────────────────┐
│  ━━━                                              │  ← 2px top mark, tier color, 32px wide
│                                                    │
│  TIER 1 · WORKED EXAMPLE                            │  ← micro label
│                                                    │
│  When a $500K outlier breaks your average           │  ← h2
│                                                    │
│  [body content, varies by tier]                     │
│                                                    │
└──────────────────────────────────────────────────┘
```

Specifications:
- No outer border. Sits on `paper` background, contents float in the 8-column inset.
- The 2px top mark is the **only** structural color cue. 32px wide, top-left aligned, color from the tier mark palette.
- Tier label is `text-micro`, ink-subtle, separator " · ".
- Title is `text-h2`, ink, with `space-4` below.
- Internal padding within the inset: `space-6` top, 0 sides (inherits inset), `space-6` bottom.

### WorkedExample (Tier 1)

```
┌──────────────────────────────────────────────────┐
│  ━━━                                              │
│  TIER 1 · WORKED EXAMPLE                          │
│  When a $500K outlier breaks your average          │
│                                                    │
│  [prose paragraph 1]                              │
│  [prose paragraph 2]                              │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │  Mean    $93,400    pulled by the outlier │    │  ← code block
│  │  Median  $68,500    unaffected             │    │     (mono, accent-tint bg)
│  └──────────────────────────────────────────┘    │
│                                                    │
│  [interpretation paragraph]                       │
│                                                    │
│  ────────                                         │  ← 0.5px ink-subtle, 80px wide
│                                                    │
│  DID THIS LAND?                                    │  ← micro label
│                                                    │
│  ○  Yes, I see why median fits here                │  ← option, default state
│  ○  Sort of — show me another example              │
│  ○  Not yet — slow down                            │
│                                                    │
└──────────────────────────────────────────────────┘
```

Specifications:
- Code/data blocks: mono font, 13px/20px, `accent-tint` background, `space-4` padding, no border.
- Glossary terms inline (e.g., "outlier") are `dictionary-mark` styled — see § 6.
- Comprehension check options use 14px circular radio (1px ink-muted border, no fill until selected). Selected state: ink fill, ink ring, no animation.
- The 80px-wide divider above the comprehension check is a deliberate Swiss-style typographic break (signals "section change" without using a heading).

### ScaffoldedMCQ (Tier 2)

```
┌──────────────────────────────────────────────────┐
│  ━━━                                              │
│  TIER 2 · SCENARIO                                │
│  A student asks about nonprofit ed roles          │
│                                                    │
│  [setup paragraph, 2-4 sentences]                 │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │  Mean: $72,000                            │    │
│  │  Median: $58,000                          │    │  ← summary stats artifact
│  │  N=31                                     │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  Which response most honestly represents           │
│  what the data shows?                              │
│                                                    │
│  ┌────────────────────────────────────────┐      │
│  │ A   "Most grads earn around $72K — that's a  │  ← option card
│  │     solid path."                         │      │     (1px ink-subtle border)
│  └────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────┐      │
│  │ B   "Most grads land closer to $58K. The     │
│  │     $72K average reflects a few high outliers." │
│  └────────────────────────────────────────┘      │
│  [...]                                             │
│                                                    │
│  ─────                                            │
│                                                    │
│  HINT                                              │  ← always-visible, never collapsed
│  Mean > median means the distribution is          │
│  right-skewed. Which measure better represents     │
│  the typical student?                              │
│                                                    │
└──────────────────────────────────────────────────┘
```

Specifications:
- Option cards: 1px `ink-subtle` border, `space-4` padding, hover state changes border to ink (no background change).
- Option ID (A/B/C/D) is `text-small`, `text-mono`, `space-3` from the option text, top-aligned.
- Selected option: 2px ink left border, no fill change.
- Correct answer feedback after submission: a 0.5px ink underline appears beneath the selected option text. No checkmark, no green.
- Incorrect answer feedback: 0.5px accent underline, plus the per-option feedback text appears in `text-small`, ink-muted, below the option.
- Hint label is `text-micro`, hint body is `text-small` `ink-muted`. Always rendered, never gated.

### GuidedShortAnswer (Tier 3)

```
┌──────────────────────────────────────────────────┐
│  ━━━                                              │
│  TIER 3 · APPLY                                   │
│  Negotiating from the right number                 │
│                                                    │
│  [scenario paragraph]                             │
│                                                    │
│  In 2-3 sentences, what do you tell them?          │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │                                            │    │  ← textarea
│  │                                            │    │     (1px ink-subtle, no rounded corners)
│  │                                            │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  CONSIDER                                          │  ← scaffolds (always visible)
│  · Which number anchors the negotiation?           │
│  · What does $62K mean relative to median?         │
│                                                    │
│                              [submit response →]   │  ← right-aligned text button
└──────────────────────────────────────────────────┘
```

Specifications:
- Textarea: 0px border-radius (sharp corners — Swiss style avoids rounded corners on functional elements).
- Submit is a right-aligned text-link with " →" arrow. Not a button. On hover: underline appears.
- Scaffolds are `text-small`, ink-muted, with raised middle-dot bullets (· not •).

### BareLongAnswer (Tier 4)

```
┌──────────────────────────────────────────────────┐
│  ━━━                                              │
│  TIER 4 · OPEN                                    │
│  Reading a Glassdoor printout                      │
│                                                    │
│  [longer scenario paragraph, 4-6 sentences]       │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │                                            │    │  ← larger textarea
│  │                                            │    │
│  │                                            │    │
│  │                                            │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  Stuck? See examples              [submit →]       │  ← deliberate friction
└──────────────────────────────────────────────────┘
```

Specifications:
- No scaffolds, no hints, no consider-prompts. Bare.
- "Stuck? See examples" is `text-small`, `ink-subtle`, on hover becomes ink-muted with underline. Click reveals 1-2 example responses from past learners (synthetic for v1) in a slide-down panel.

### WikiDraft (Tier 5)

```
┌──────────────────────────────────────────────────┐
│  ━━━                                              │
│  TIER 5 · CONTRIBUTE                              │
│  Write the entry a new advisor needs               │
│                                                    │
│  [longer prose framing the contribution task]     │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │                                            │    │  ← textarea, even taller
│  │                                            │    │
│  │                                            │    │
│  │                                            │    │
│  │                                            │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  Your response will be reviewed before any other   │  ← small, ink-muted
│  staff sees it. You will be a named contributor.   │
│                                                    │
│                                       [submit →]   │
└──────────────────────────────────────────────────┘
```

Specifications:
- Visually identical to Tier 4 except: micro-label says "TIER 5 · CONTRIBUTE," and a privacy note sits below the textarea.
- The privacy note is non-negotiable here. It earns the right to ask for the contribution.

### RenderedChart (visualizer component)

A new component that the Content Generator can include in any scaffold via tool call. The LLM picks chart type and parameters; the component renders.

```
┌──────────────────────────────────────────┐
│                                            │
│  [chart canvas, 480 × 280px]              │  ← Chart.js render
│                                            │
└──────────────────────────────────────────┘
  Distribution of 28 graduate salaries          ← caption, text-small, ink-muted
  Synthetic data · cohort 2024                  ← provenance, text-micro, ink-subtle
```

Specifications:
- Five chart types only: `histogram`, `bar`, `box`, `scatter`, `time_series`. The Content Generator picks from this enum. No others.
- Single-color palette: ink for bars/lines, accent for highlighted elements (e.g., the outlier in a histogram).
- No gridlines except a single 0.5px ink-subtle baseline. No legends unless multiple series. No 3D, no gradients, no fill-under-line patterns.
- Caption (under the chart) is mandatory and explains what the chart shows. Provenance line below it is mandatory and declares synthetic boundary.
- Aspect ratio: 12:7 (480 × 280). Charts never break out of the 8-column module inset.
- Tool call schema:
  ```typescript
  {
    chart_type: 'histogram' | 'bar' | 'box' | 'scatter' | 'time_series',
    dataset_ref: string,         // must reference an existing dataset
    field_x: string,             // field name from dataset
    field_y?: string,            // optional, depending on chart type
    highlight_ids?: string[],    // row IDs to render in accent
    caption: string,
    provenance: string
  }
  ```
- Implementation: Chart.js 4.x via `vue-chartjs`. Pre-build all five chart-type wrappers. The LLM never writes Chart.js config directly.

### RenderedFlowchart (visualizer component, sibling of RenderedChart)

A second visualizer the Content Generator can include in any scaffold via tool call. Used for sequential reasoning (cohort filter funnels, "how to read this report" steps), not for quantitative data — that is RenderedChart's job.

```
┌──────────────────────────────────────────────────┐
│                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │ Applied  │ →  │ Admitted │ →  │ Enrolled │    │
│  │  1,240   │    │   312    │    │   198    │    │
│  └──────────┘    └──────────┘    └──────────┘    │
│       100%            25%             16%          │
│                                                    │
└──────────────────────────────────────────────────┘
  How a cohort funnels: applied → admitted → enrolled    ← caption, text-small, ink-muted
  Synthetic data · cohort 2024                            ← provenance, text-micro, ink-subtle
```

Specifications:
- Three flowchart types only: `linear` (left-to-right boxes with arrows, used for funnels and sequential steps), `decision` (one node branches into 2-3 outcomes — used for "if median > mean, then…"), `cycle` (closed loop — used for the data-reading routine: notice → think → wonder → notice).
- Boxes: 1px ink-subtle border (matches the option card spec), `space-3` padding, `text-small` ink for the label, optional `text-micro` ink-subtle annotation below the box (e.g., percentages or row counts).
- Arrows: 0.5px ink-subtle straight line with a 6px ink chevron at the head. No curves, no animations, no color.
- Highlighted node (e.g., the step the scenario asks about): swap border to 2px ink. No fill change.
- No outer container border. The flowchart sits on `paper`, like the chart, with the same caption + provenance pair below.
- Layout: single row when ≤ 4 nodes; wraps to a second row at 5+ with a vertical arrow in between. Maximum 6 nodes total — beyond that the Content Generator must split into multiple flowcharts.
- Aspect ratio: width fits the 8-column inset, height is content-driven.
- Tool call schema:
  ```typescript
  {
    flowchart_type: 'linear' | 'decision' | 'cycle',
    nodes: Array<{
      id: string,
      label: string,                  // ≤ 24 chars
      annotation?: string             // ≤ 16 chars, e.g., "100%" or "n=1,240"
    }>,
    edges: Array<{
      from: string,                   // node id
      to: string,                     // node id
      label?: string                  // ≤ 12 chars, optional edge label
    }>,
    highlight_node_ids?: string[],
    caption: string,
    provenance: string
  }
  ```
- Implementation: pure SVG component, no external library. Node positions computed deterministically from `flowchart_type` and node count. The LLM never specifies coordinates.

### Generative-UI tool-call contract (Content Generator → Vue)

The Content Generator can invoke **two visualization tools** during a streaming response. They are the only visualization affordances; everything else is prose, code blocks, or option cards. Tool definitions match these names exactly (drift breaks rendering, see F010 acceptance criteria):

| Tool | Component | When to use |
|---|---|---|
| `render_chart` | `RenderedChart.vue` | Quantitative data — distributions, group comparisons, time series, scatter relationships. |
| `render_flowchart` | `RenderedFlowchart.vue` | Sequential or branching reasoning — cohort funnels, decision trees, the See-Think-Wonder loop. |

Rules:
- A scenario may include at most **one chart and one flowchart** per turn. The Content Generator must justify each visualization in its tool-call rationale; "decorative" calls fail review.
- Tool calls render inline as `message.parts` per AI SDK v6 idioms (CLAUDE.md § AI SDK v6 idioms). Vue components receive the tool input as props directly — no JSON re-parsing.
- Both tools require `caption` and `provenance` strings. Provenance must declare the synthetic boundary (e.g., "Synthetic data · cohort 2024"). Validators reject calls missing either field.
- Charts that reference `dataset_ref` must point to an existing dataset; the validator (extended in F005, see feature_list.json F005 builder rule) checks that `field_x` and `field_y` exist in the dataset's rows.
- Flowchart node and edge counts are bounded (≤ 6 nodes, edges only between declared node ids). The Vue component throws on invalid input — failures are loud, not silent.

### DictionaryPopover and DictionaryView

Inline popover (hover-triggered) and standalone page (`/dictionary`).

Popover specifications:
- Trigger: hover on any inline term wrapped in `<dictionary-mark>`. Mark style: 0.5px dotted ink-subtle underline, no color change.
- Popover: 280px max-width, 1px ink border, paper background, `space-4` padding, no shadow.
- Contents: term in `text-small` ink, plain definition in `text-small` ink-muted, "see full entry →" text-link.
- Close: escape key, click outside, or move mouse > 50px from trigger.
- Animation: 100ms opacity fade only. No translate, no scale.

Standalone page specifications:
- Two-column layout: sidebar (3 cols) with search and term list, detail (5 cols) with the selected term.
- Search input: full-width sidebar, 1px ink-subtle border bottom only (no other borders), placeholder "Search terms…" in `ink-subtle`.
- Term list: `text-small`, alphabetical, current term highlighted with 2px ink left border.
- Detail header: term in `text-h2`, plain definition in `text-body` ink-muted, immediately below.
- School usage: rendered as a definition list (not a table), with school name in `text-micro` ink-subtle as the term, usage note in `text-small` ink as the description.

## 6. Inline elements

### Inline term mark (dictionary)

`<span class="dictionary-mark">median</span>` — gets a 0.5px dotted underline in `ink-subtle`. On hover, underline becomes solid `ink-muted`. No background change, no color change.

### Inline code

`<code>` — JetBrains Mono 13px, no background, ink color. Used inline only for dataset field names and short numeric values.

### Inline strong

`<strong>` — Inter 600. No color change. Reserved for the single most important phrase in a paragraph; no more than one per paragraph.

### Inline em

`<em>` — Inter 400 italic. Reserved for citation titles and proper nouns where titling convention requires italic. Not for emphasis.

## 7. States

### Focus

All interactive elements: 2px accent outline at 2px offset, no border-radius. `outline-offset: 2px;`. Never use `:focus-visible: none`. Keyboard focus is the most important state in the app — it must be visible.

### Hover

Text-links: underline appears (no underline by default). Buttons (text-buttons): underline appears.
Cards: 1px ink-subtle border becomes 1px ink. No fill change, no shadow.

### Active / pressed

Text-links: underline thickens to 1px from 0.5px. Cards: no change (the click is its own feedback).

### Disabled

Opacity 0.4. No other change. Cursor: not-allowed.

### Loading

A single 0.5px line under the affected region, animating left-to-right at 1.5s linear. No spinners, no skeleton screens, no shimmer.

### Empty

Empty states (no scenarios yet, no dictionary results) use `text-small` `ink-muted`, centered in the affected region, with a single sentence describing why the state is empty and what to do. No illustrations.

## 8. Motion

Three durations:

- 100ms — popover fade, hover transitions
- 150ms — option selection, focus ring appearance
- 250ms — scaffold-tier transitions (fading in the new tier component as the old one fades out)

One easing function: `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material's standard curve, but used sparingly).

Forbidden:
- Spring physics
- Bounce easings
- Stagger animations on lists
- Auto-rotating carousels
- Parallax
- Page transitions beyond opacity fade

## 9. Iconography

Lucide icons (lucide-vue-next), 16px or 20px, stroke 1.5px, ink color. Six icons total in the app, no more:

- `arrow-right` — submit and "see more" links
- `chevron-down` — disclosure (in dictionary popover, "stuck? see examples")
- `search` — dictionary search input adornment
- `info` — privacy notice marker
- `book-open` — dictionary navigation marker
- `check` — completed lesson marker in progress dots (only used post-completion)

If a designer reaches for a seventh icon, they should use a text-link instead.

## 10. Accessibility

- All interactive elements reachable by keyboard. Tab order matches visual order.
- Focus rings always visible (per § 7).
- Color contrast: ink on paper exceeds WCAG AAA (>14:1). ink-muted on paper passes WCAG AA (>4.5:1). ink-subtle on paper is reserved for non-essential text only (>3:1, AA Large).
- Form inputs always have associated labels, even when visually a label appears redundant.
- Charts include text-equivalent captions and a "view as table" link.
- The page renders usefully without JavaScript: the static content (concept primers, dictionary entries) is server-rendered MD; only interactive scaffolds require JS.

## 11. Implementation in Vue + Tailwind

This section gives the harness a concrete starting point. The values above are encoded as Tailwind config + a small set of custom utilities.

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{vue,ts}'],
  theme: {
    colors: {
      transparent: 'transparent',
      paper: '#FAFAF8',
      surface: '#FFFFFF',
      overlay: '#F2F2EE',
      ink: '#0A0A0A',
      'ink-muted': '#5C5C5C',
      'ink-subtle': '#8B8B8B',
      accent: '#C8362D',
      'accent-tint': '#FBE8E6',
      tier: {
        1: '#C8362D',
        2: '#8B6F47',
        3: '#4A6B47',
        4: '#3D4A6B',
        5: '#0A0A0A'
      }
    },
    fontFamily: {
      display: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
    },
    fontSize: {
      micro:    ['11px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: 500 }],
      small:    ['14px', { lineHeight: '22px' }],
      body:     ['16px', { lineHeight: '28px' }],
      h2:       ['24px', { lineHeight: '32px', letterSpacing: '-0.005em', fontWeight: 500 }],
      h1:       ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: 500 }],
      display:  ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: 500 }]
    },
    spacing: {
      0:  '0',
      1:  '4px',
      2:  '8px',
      3:  '12px',
      4:  '16px',
      6:  '24px',
      8:  '32px',
      12: '48px',
      16: '64px'
    },
    borderRadius: {
      none: '0',
      DEFAULT: '0'  // Swiss minimalism: no rounded corners
    },
    extend: {
      borderWidth: {
        '0.5': '0.5px'  // for fine dividers
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
      },
      transitionDuration: {
        DEFAULT: '150ms'
      }
    }
  },
  plugins: []
} satisfies Config;
```

### Component naming convention

- `LMSShell.vue`, `ScaffoldContainer.vue` — wrappers
- `WorkedExample.vue`, `ScaffoldedMCQ.vue`, `GuidedShortAnswer.vue`, `BareLongAnswer.vue`, `WikiDraft.vue` — five tier components, names match scaffold-selector output exactly
- `RenderedChart.vue`, `RenderedFlowchart.vue` — visualizers (invoked via tool calls)
- `DictionaryPopover.vue`, `DictionaryView.vue` — dictionary surfaces
- `ContributedEntries.vue` — "Contributed by staff" block on a dictionary term page (see SPEC.md §7)
- `MicroLabel.vue`, `Caption.vue`, `Divider.vue` — primitive typographic components

PascalCase file names match component names exactly. No abbreviations.

## 12. What this design avoids — and why

A short list of anti-patterns the harness must not produce. If Claude Code generates any of these, the reviewer rejects:

- **Rounded corners on cards, buttons, or inputs.** Swiss minimalism keeps geometry sharp. Border-radius is 0px.
- **Drop shadows.** Hierarchy is established by typography and whitespace, not depth.
- **Gradients.** Solid colors only.
- **Decorative illustrations.** Unsplash-style header images, hero illustrations, or any image that exists for "warmth" rather than information. Charts and data visualizations are the only images allowed.
- **Multiple accent colors.** One accent only.
- **Filled status badges (green = correct, red = wrong).** Validation is conveyed through underlines and feedback prose, not color-block badges.
- **Rotating loading spinners.** Use the 0.5px line described in § 7 instead.
- **All-caps headings.** ALL CAPS appears only in `text-micro` eyebrow labels.
- **Multiple fonts.** Inter + JetBrains Mono. Adding a third font is a violation.
- **Tooltips on hover for explanatory text.** If the explanation is necessary, it should be visible. If it isn't, it shouldn't be there.

## 13. References for inspiration

The harness can grep these names if it needs to anchor a design decision in a known reference:

- Massimo Vignelli (NYC Subway, MTA, Knoll) — grid, restraint, color discipline
- Josef Müller-Brockmann — typographic grid systems
- Anton Stankowski — diagrammatic communication, structural use of color
- Dieter Rams — "less but better"
- Kinfolk magazine, Apartamento — editorial whitespace and typographic restraint
- Otl Aicher (1972 Munich Olympics) — pictograms, system thinking
- Linear (linear.app), Stripe Press (stripe.press) — contemporary applications of these principles in software

## 14. Version

v1.0 — initial design system. Locked for v1 build. Changes require human approval logged in `warnings/design-changes.md`.
