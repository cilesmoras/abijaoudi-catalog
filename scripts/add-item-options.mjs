// Incremental migration: add menu-style item options (variants) — a nullable
// `options_label` column on items (the option group's label, e.g. "Size") and
// an `item_options` child table holding the priced choices.
// `drizzle-kit push` hangs in this project, so we apply the change via a direct
// postgres connection. Run with: npm run db:migrate:options
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
  console.log("Adding items.options_label column...");
  await sql`
    ALTER TABLE items
      ADD COLUMN IF NOT EXISTS options_label text
  `;

  console.log("Creating item_options table...");
  await sql`
    CREATE TABLE IF NOT EXISTS item_options (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      name text NOT NULL,
      price numeric(10, 2) NOT NULL,
      sort_order numeric NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS item_options_item_sort_key
      ON item_options (item_id, sort_order)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS item_options_item_id_idx
      ON item_options (item_id)
  `;

  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
