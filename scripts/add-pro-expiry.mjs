// Incremental migration: add profiles.pro_expires_at (when the current manually
// granted Pro term lapses). Set 30 days out on each activation; surfaces an
// owner-facing countdown. `drizzle-kit push` hangs in this project, so apply via
// a direct postgres connection.
// Run with: npm run db:migrate:pro-expiry
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false, ssl: "require" });

async function main() {
  console.log("Adding profiles.pro_expires_at column...");
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_expires_at timestamptz`;
  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
