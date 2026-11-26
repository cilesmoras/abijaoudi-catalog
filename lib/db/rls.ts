import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** A Drizzle transaction handle, as passed to `db.transaction(fn)`. */
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Anything queries can run on: the postgres connection or an RLS transaction. */
export type DbExecutor = typeof db | DbTx;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Runs `fn` in a transaction as the `app_owner` role, scoped to `ownerId` by
 * the RLS policies in drizzle/0005_rls_owner_policies.sql. Use it for every
 * owner/dashboard query so the database backs up our `owner_id` filters.
 *
 * `ownerId` must come from the getUser()-validated session (getCurrentProfile
 * / requireUser). Never pass a client-supplied id.
 *
 * Both settings are transaction-local, so they reset at COMMIT and are safe
 * with Supavisor's transaction pooling. Don't run Promise.all inside `fn`: a
 * transaction runs one statement at a time. Call withRLS once per parallel
 * read instead.
 */
export async function withRLS<T>(
  ownerId: string,
  fn: (tx: DbTx) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(ownerId)) {
    throw new Error("withRLS: ownerId must be a UUID");
  }
  const claims = JSON.stringify({ sub: ownerId, role: "authenticated" });

  return db.transaction(async (tx) => {
    // One round trip: set the claims app_private.uid() reads, then drop
    // privileges to app_owner (set_config('role') is SET LOCAL ROLE).
    await tx.execute(sql`
      select set_config('request.jwt.claims', ${claims}, true),
             set_config('role', 'app_owner', true)
    `);
    return fn(tx);
  });
}
