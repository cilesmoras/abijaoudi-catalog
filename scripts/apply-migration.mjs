// One-off migration runner. `drizzle-kit push` hangs in this project, so we
// apply schema changes via a direct postgres connection instead.
// Run with: npm run db:migrate
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
  console.log("Applying multi-tenant schema...");

  await sql.begin(async (tx) => {
    // Throwaway dev data — drop the old single-tenant tables.
    await tx`DROP TABLE IF EXISTS items CASCADE`;
    await tx`DROP TABLE IF EXISTS categories CASCADE`;
    await tx`DROP TABLE IF EXISTS settings CASCADE`;
    await tx`DROP TABLE IF EXISTS profiles CASCADE`;

    // profiles.id references the Supabase auth.users row (1 profile per user).
    await tx`
      CREATE TABLE profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        handle text NOT NULL UNIQUE,
        catalog_name text NOT NULL,
        phone text,
        contact_email text,
        address text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await tx`
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        name text NOT NULL,
        slug text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await tx`
      CREATE UNIQUE INDEX categories_owner_slug_key
        ON categories (owner_id, slug)
    `;

    await tx`
      CREATE TABLE items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        name text NOT NULL,
        description text,
        price numeric(10, 2) NOT NULL,
        image_url text,
        thumbnail_url text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await tx`CREATE INDEX items_owner_id_idx ON items (owner_id)`;
    await tx`CREATE INDEX categories_owner_id_idx ON categories (owner_id)`;
  });

  console.log("Schema applied successfully.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await sql.end();
  process.exit(1);
});
