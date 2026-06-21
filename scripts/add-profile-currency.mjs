// Incremental migration: add the `currency` field (ISO 4217 code) to profiles
// so monetary amounts on the catalog can be shown with the owner's currency
// symbol. `drizzle-kit push` hangs in this project, so we apply the change via a
// direct postgres connection. Run with: npm run db:migrate:currency
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
  console.log("Adding profiles.currency column...");
  await sql`
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS currency text
  `;
  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
