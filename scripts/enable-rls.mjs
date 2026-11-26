// Applies drizzle/0004_enable_rls_lockdown.sql and verifies the result.
// Idempotent — safe to re-run. Run with: node scripts/enable-rls.mjs
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require" });
const migration = readFileSync(
  new URL("../drizzle/0004_enable_rls_lockdown.sql", import.meta.url),
  "utf8",
);

try {
  await sql.begin((tx) => tx.unsafe(migration));

  const tables = await sql`
    select c.relname, c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by 1`;
  const grants = await sql`
    select grantee, table_name, privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public' and grantee in ('anon', 'authenticated')`;

  console.table(tables);
  const unlocked = tables.filter((t) => !t.relrowsecurity);
  if (unlocked.length || grants.length) {
    console.error("Lockdown incomplete:", { unlocked, grants });
    process.exitCode = 1;
  } else {
    console.log("RLS enabled on all public tables; anon/authenticated have no grants.");
  }
} finally {
  await sql.end();
}
