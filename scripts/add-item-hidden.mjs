// Incremental migration: add the `hidden` flag to items so owners can take an
// item off their public catalog without deleting it. `drizzle-kit push` hangs
// in this project, so we apply the change via a direct postgres connection.
// Run with: npm run db:migrate:hidden
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

// prepare:false matches lib/db/index.ts (Transaction pool mode).
const sql = postgres(connectionString, { prepare: false, ssl: "require" });

async function main() {
  console.log("Adding items.hidden column...");
  await sql`
    ALTER TABLE items
      ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false
  `;
  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
