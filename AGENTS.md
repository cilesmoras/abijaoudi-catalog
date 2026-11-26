<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database security (Supabase RLS)

All table access goes through Drizzle as the `postgres` role (bypasses RLS). The Data API is locked down: every `public` table has RLS enabled with **no policies**, and `anon`/`authenticated` have no grants (see `drizzle/0004_enable_rls_lockdown.sql`).

- Every new table migration must include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`. Never `GRANT` to `anon`/`authenticated`.
- Never query tables with supabase-js from the browser — it will fail by design. Enforce ownership in server code (`lib/dal.ts`, `owner_id` filters).
- Apply SQL migrations with `npm run db:migrate -- drizzle/<file>.sql` (`scripts/run-sql-migration.mjs`, one transaction).
- Per-owner policies (`drizzle/0005_rls_owner_policies.sql`) target a private NOLOGIN role `app_owner`, never `authenticated` (granting `authenticated` would reopen PostgREST to logged-in owners and skip app rules like the Free item cap). Owner id comes from `app_private.uid()` (reads `request.jwt.claims.sub`; Supabase won't let us grant on `auth`).
- Owner/dashboard queries run through `withRLS` from `lib/db/rls.ts` (transaction + `SET LOCAL ROLE app_owner` + claims from the `getUser()`-validated user). Public catalog reads, `/api/track`, admin, onboarding, handle uniqueness, Pro-only profile fields (handle, logo, socials), plan/upgrade fields and `auth.users` reads stay on the postgres connection.
- Shared query helpers take an optional `exec: DbExecutor = db`; dashboard callers pass the RLS `tx`. Don't `Promise.all` inside one `withRLS` — use one call per parallel read. Do storage cleanup / `revalidatePath` after the transaction returns.
- Need a privileged write and an RLS write to commit together (e.g. profile save: Pro-only fields as postgres, then the rest)? Use `db.transaction` + `asOwner(tx, ownerId)` after the privileged part.
- New tables: add `app_owner` grants + an owner policy in the same migration, index `owner_id`, and extend `scripts/test-rls.mjs`.
