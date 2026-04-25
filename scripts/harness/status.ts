#!/usr/bin/env bun
// Harness status report. Run on resume to see where the build is.
// Reads claude-progress.txt, decisions/, warnings/, and feature_list.json.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..', '..');

function read(path: string): string {
  try { return readFileSync(join(root, path), 'utf-8'); }
  catch { return ''; }
}

function listDir(path: string): string[] {
  try { return readdirSync(join(root, path)).filter(f => !f.startsWith('.')); }
  catch { return []; }
}

const features = JSON.parse(read('feature_list.json')).features;
const progress = read('claude-progress.txt').split('\n').filter(l => l && !l.startsWith('#'));
const decisions = listDir('decisions').filter(f => f.endsWith('.md'));
const warnings = listDir('warnings').filter(f => f.endsWith('.md'));
const credBlocks = read('warnings/credential-blocks.md');

const env = (() => {
  const envFile = read('.env');
  const keys = new Set<string>();
  for (const line of envFile.split('\n')) {
    const m = line.match(/^([A-Z_]+)=.+/);
    if (m && !line.trim().startsWith('#')) keys.add(m[1]);
  }
  return keys;
})();

const credStatus = (cred: string) => env.has(cred) ? '✓' : '✗';

console.log('━'.repeat(60));
console.log('HARNESS STATUS');
console.log('━'.repeat(60));
console.log();
console.log('Features:');
for (const f of features) {
  const last = [...progress].reverse().find(l => l.includes(`· ${f.id} ·`));
  const status = last ? last.split(' · ').slice(2).join(' · ') : 'pending';
  console.log(`  ${f.id.padEnd(6)} ${f.title.slice(0, 48).padEnd(50)} ${status}`);
}
console.log();
console.log('Credentials:');
console.log(`  ${credStatus('GEMINI_API_KEY')} GEMINI_API_KEY     (gates F003, F004, F006, F010)`);
console.log(`  ${credStatus('DATABASE_URL')} DATABASE_URL       (gates wiki draft persistence; localStorage fallback OK)`);
console.log(`  ${credStatus('VERCEL_TOKEN')} VERCEL_TOKEN       (gates deploy)`);
console.log();
console.log(`Decisions logged: ${decisions.length}`);
for (const d of decisions) console.log(`  ${d}`);
console.log();
console.log(`Warnings: ${warnings.length}`);
for (const w of warnings) console.log(`  ${w}`);
console.log();
console.log('Last 5 progress events:');
for (const l of progress.slice(-5)) console.log(`  ${l}`);
console.log('━'.repeat(60));
