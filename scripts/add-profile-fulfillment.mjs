// Incremental migration: add fulfillment fields (delivery / pickup options,
// accepted delivery payment methods, and a flat delivery fee) to profiles so
// owners can tell customers how they fulfill orders.
// `drizzle-kit push` hangs in this project, so we apply the change via a direct
// postgres connection. Run with: npm run db:migrate:fulfillment
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
  console.log("Adding profiles fulfillment columns...");
  await sql`
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS offers_delivery boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS offers_pickup boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS delivery_payment_upfront boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS delivery_payment_cod boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS delivery_fee numeric(10, 2)
  `;
  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
