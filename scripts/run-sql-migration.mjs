// Applies one SQL migration file in a single transaction.
// Usage: node scripts/run-sql-migration.mjs drizzle/0005_rls_owner_policies.sql
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const file = process.argv[2];
if (!file || !process.env.DATABASE_URL) {
  console.error("Usage: node scripts/run-sql-migration.mjs <file.sql> (needs DATABASE_URL)");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require", onnotice: () => {} });
try {
  await sql.begin((tx) => tx.unsafe(readFileSync(file, "utf8")));
  console.log(`Applied ${file}`);
} catch (err) {
  console.error(`Failed to apply ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
