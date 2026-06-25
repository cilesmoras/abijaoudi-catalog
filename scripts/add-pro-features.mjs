// Incremental migration for the Pro plan work: adds the upgrade-request flag
// and Pro social links to profiles, plus the item_images (multi-photo) and
// catalog_events (analytics) tables. `drizzle-kit push` hangs in this project,
// so we apply the change via a direct postgres connection.
// Run with: npm run db:migrate:pro
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
  console.log("Adding Pro-plan columns and tables...");

  await sql.begin(async (tx) => {
    // profiles: upgrade-request flag + Pro social links.
    await tx`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upgrade_requested_at timestamptz`;
    await tx`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_url text`;
    await tx`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url text`;
    await tx`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_url text`;

    // Pro-only additional item photos (cover stays on items.image_url).
    await tx`
      CREATE TABLE IF NOT EXISTS item_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        url text NOT NULL,
        thumbnail_url text,
        sort_order numeric NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await tx`
      CREATE UNIQUE INDEX IF NOT EXISTS item_images_item_sort_key
        ON item_images (item_id, sort_order)
    `;
    await tx`CREATE INDEX IF NOT EXISTS item_images_item_id_idx ON item_images (item_id)`;

    // Pro-only analytics events for the public catalog.
    await tx`
      CREATE TABLE IF NOT EXISTS catalog_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        type text NOT NULL,
        item_id uuid REFERENCES items(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await tx`
      CREATE INDEX IF NOT EXISTS catalog_events_owner_created_idx
        ON catalog_events (owner_id, created_at)
    `;
  });

  console.log("Done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
