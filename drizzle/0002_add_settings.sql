CREATE TABLE IF NOT EXISTS "settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_name" text NOT NULL DEFAULT 'Supermarket Catalog',
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
INSERT INTO "settings" ("store_name")
  SELECT 'Supermarket Catalog' WHERE NOT EXISTS (SELECT 1 FROM "settings");
