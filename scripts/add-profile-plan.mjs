// Incremental migration: add the `plan` (subscription tier) and `logo_url`
// (Pro PDF logo) columns to profiles. `drizzle-kit push` hangs in this project,
// so we apply the change via a direct postgres connection.
// Run with: npm run db:migrate:plan
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
  console.log("Adding profiles.plan and profiles.logo_url columns...");
  await sql`
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  `;
  await sql`
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS logo_url text
  `;
  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
