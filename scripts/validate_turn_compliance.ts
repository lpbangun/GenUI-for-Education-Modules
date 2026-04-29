// scripts/validate_turn_compliance.ts
// Soft validator: scans a list of Turns (from a fixtures file passed as
// argv[2], or from stdin as JSON array) and reports compliance failures.
// Always advisory — never throws, never exits non-zero on bad data.
//
// Per DD-006, this is the escalation signal: if any check exceeds 20%
// failure rate sustained, that is the trigger to adopt schema-typed
// templates (deferred path B in the spec).

import type { Turn, DictionaryHandoff } from '../lib/types';
import { readFileSync } from 'node:fs';

interface CheckResult {
  passes: number;
  fails: number;
  failures: string[];
}

export interface ComplianceResult {
  total: number;
  failures: string[];
  perCheck: Record<string, CheckResult>;
}

function tierAllowsHandoffKind(tier: string, kind: DictionaryHandoff['kind']): boolean {
  if (kind === 'passive') return tier === 'WorkedExample' || tier === 'ScaffoldedMCQ';
  if (kind === 'active') return tier === 'GuidedShortAnswer' || tier === 'BareLongAnswer';
  if (kind === 'constructive') return tier === 'WikiDraft';
  return false;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function checkTurnCompliance(turn: Turn): { failures: string[] } {
  const failures: string[] = [];
  const input = turn.scaffold.input as Record<string, any>;

  if (!tierAllowsHandoffKind(turn.tier, turn.dictionaryHandoff.kind)) {
    failures.push(`handoff kind=${turn.dictionaryHandoff.kind} not allowed for tier=${turn.tier}`);
  }

  if (turn.tier === 'ScaffoldedMCQ') {
    if (!input.observation_prompt || typeof input.observation_prompt !== 'string') {
      failures.push('T2: observation_prompt missing');
    }
    const opts = (input.options ?? []) as Array<{ feedback?: string }>;
    for (const o of opts) {
      if (!o.feedback || wordCount(o.feedback) < 12) {
        failures.push('T2: option feedback < 12 words (likely "wrong, try again" boilerplate)');
        break;
      }
    }
  }

  if (turn.tier === 'GuidedShortAnswer') {
    const cs = (input.consider_scaffolds ?? []) as string[];
    if (cs.length < 3) {
      failures.push('T3: consider_scaffolds needs claim+support+question (min 3)');
    }
  }

  if (turn.termsSurfaced.length === 0) {
    failures.push('terms_surfaced: empty (no dictionary handoff signal)');
  }

  return { failures };
}

export function runCompliance(turns: Turn[]): ComplianceResult {
  const perCheck: Record<string, CheckResult> = {};
  const allFailures: string[] = [];
  for (const t of turns) {
    const { failures } = checkTurnCompliance(t);
    for (const f of failures) {
      const key = f.split(':')[0] ?? f;
      perCheck[key] ??= { passes: 0, fails: 0, failures: [] };
      perCheck[key].fails++;
      perCheck[key].failures.push(f);
      allFailures.push(f);
    }
  }
  return { total: turns.length, failures: allFailures, perCheck };
}

if (import.meta.main) {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: bun run scripts/validate_turn_compliance.ts <fixtures.json>');
    process.exit(0);
  }
  const turns = JSON.parse(readFileSync(path, 'utf-8')) as Turn[];
  const r = runCompliance(turns);
  console.log(`Compliance report — ${r.total} turns, ${r.failures.length} failures.`);
  for (const [check, c] of Object.entries(r.perCheck)) {
    console.log(`  ${check}: ${c.fails} failures`);
  }
}
