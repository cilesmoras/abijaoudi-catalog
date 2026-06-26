// Incremental migration: add profiles.upgrade_request_message (the optional note
// a user includes with their Pro upgrade request). `drizzle-kit push` hangs in
// this project, so apply via a direct postgres connection.
// Run with: npm run db:migrate:upgrade-message
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
  console.log("Adding profiles.upgrade_request_message column...");
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgrade_request_message text`;
  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
