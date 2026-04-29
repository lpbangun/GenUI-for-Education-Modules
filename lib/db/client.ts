// lib/db/client.ts
// Lazy Drizzle client — server can boot without DATABASE_URL; the handoff
// repos return a "no-op" implementation that logs a warning when the DB is
// not configured. Mirrors the lazy-provider pattern in backend/index.ts.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

export function getDb(): DB | null {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const client = postgres(url, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
