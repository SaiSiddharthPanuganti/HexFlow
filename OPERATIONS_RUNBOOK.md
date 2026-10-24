# HexFlow Operations Runbook

## Production environment

Render must have:

- `NODE_ENV=production`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `FRONTEND_URL` set to the exact Vercel origin, without a trailing slash
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `RATE_LIMIT_MODE=upstash`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN` (recommended)

Vercel must have:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN` (recommended)

Never put `GEMINI_API_KEY`, a Supabase service-role key, or an Upstash token in Vercel variables.

## Database deployment

Apply migrations in order:

1. `supabase/migrations/20261023000000_create_workflows.sql`
2. `supabase/migrations/20261024000000_harden_workflows.sql`

Then run `supabase/verify_rls.sql`. Record the output in the release ticket and perform the two-account test:

- Account A can create/read/update/delete only A's rows.
- Account B can create/read/update/delete only B's rows.
- Account A cannot select, update, or delete B's workflow by ID.

## Release smoke test

1. `GET /api/health` returns `200`.
2. `POST /api/workflow/generate` without a bearer token returns `401`.
3. Signed-in generation succeeds.
4. Expired-token request refreshes once, then succeeds or returns a sign-in message.
5. Save/reload returns the same workflow and revision.
6. Two-tab stale save returns a conflict instead of overwriting newer data.
7. Invalid CORS origins do not receive `Access-Control-Allow-Origin`.

## Rollback

1. Stop new launch traffic or disable the frontend deployment if data integrity is at risk.
2. Redeploy the previous known-good Vercel deployment.
3. Redeploy the previous known-good Render commit.
4. Do not roll back a database migration by deleting columns. Create a forward fix unless the migration has an explicitly tested down migration.
5. Re-run the health and signed-in smoke tests.
6. Preserve Render logs, Sentry event IDs, deployment IDs, and the failing request timestamp for the incident record.

Record the Vercel deployment ID, Render deploy ID, Git commit, migration version, and operator for each release.
