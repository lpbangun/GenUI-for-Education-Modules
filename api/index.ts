// Vercel serverless entry. Re-exports the Hono app from /backend/index.ts as
// a request handler. Vercel runs Node 20+; @hono/node-server adapts the fetch handler.

import { handle } from 'hono/vercel';
import app from '../backend/index';

export const config = { runtime: 'nodejs' };

// app is `{ port, fetch: app.fetch }` from backend/index.ts; re-wrap.
const honoFetch = (app as { fetch: (req: Request) => Promise<Response> }).fetch;
export default handle({ fetch: honoFetch } as any);
