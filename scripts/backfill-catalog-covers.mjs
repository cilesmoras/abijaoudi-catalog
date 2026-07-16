// Regenerates 1200px catalog covers for items uploaded when CATALOG_MAX was
// 400px, using the Pro 1600px `-full.jpg` variant as the source. Free/legacy
// items (no full variant stored) are skipped — they only improve on re-upload.
//
// New covers are uploaded as `-cat2.jpg` (not overwritten in place) because
// the Supabase CDN and the Vercel image optimizer cache by URL. Old `-cat.jpg`
// files are reported at the end but never deleted.
//
// Usage:
//   node scripts/backfill-catalog-covers.mjs --dry-run
//   node scripts/backfill-catalog-covers.mjs --item <uuid>
//   node scripts/backfill-catalog-covers.mjs [--limit N]
import { config } from "dotenv";
import postgres from "postgres";
import sharp from "sharp";

config({ path: ".env.local" });
config();

// Keep in sync with CATALOG_MAX / quality in app/api/upload/route.ts.
const CATALOG_MAX = 1200;
const CATALOG_QUALITY = 80;
const bucketName = "item-images";

const dryRun = process.argv.includes("--dry-run");

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const onlyItem = getArg("item");
const limit = getArg("limit") ? Number(getArg("limit")) : undefined;

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!connectionString || !supabaseUrl || !serviceRoleKey) {
  console.error(
    "DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY must be set",
  );
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false, ssl: "require" });

const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${bucketName}/`;

// Talk to the Storage REST API directly: supabase-js can't be constructed on
// Node 20 (its realtime client needs native WebSocket), and we only need
// download + upload here.
const authHeaders = { Authorization: `Bearer ${serviceRoleKey}` };

async function downloadObject(path) {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucketName}/${path}`,
    { headers: authHeaders },
  );
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

async function uploadObject(path, body) {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucketName}/${path}`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body,
    },
  );
  if (!response.ok) {
    throw new Error(`upload failed (${response.status}): ${await response.text()}`);
  }
}

async function main() {
  // Old covers end in `-cat.jpg`; backfilled ones end in `-cat2.jpg`, so the
  // query stops matching them and re-runs are naturally idempotent. The
  // item_images join finds the gallery row holding this cover's 1600px full
  // variant (they share the same `<owner>/<ts>-<rand>` base).
  const candidates = await sql`
    SELECT i.id, i.name, i.image_url
    FROM items i
    WHERE i.image_url LIKE '%-cat.jpg'
      AND EXISTS (
        SELECT 1 FROM item_images im
        WHERE im.item_id = i.id
          AND im.thumbnail_url = i.image_url
          AND im.url LIKE '%-full.jpg'
      )
      ${onlyItem ? sql`AND i.id = ${onlyItem}` : sql``}
    ORDER BY i.created_at
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  const residual = await sql`
    SELECT count(*)::int AS count
    FROM items i
    WHERE i.image_url LIKE '%-cat.jpg'
      AND NOT EXISTS (
        SELECT 1 FROM item_images im
        WHERE im.item_id = i.id
          AND im.thumbnail_url = i.image_url
          AND im.url LIKE '%-full.jpg'
      )
  `;

  console.log(
    `${candidates.length} item(s) to backfill; ` +
      `${residual[0].count} old cover(s) have no full variant (Free/legacy) and will stay 400px until re-upload.`,
  );
  if (dryRun) console.log("DRY RUN — no writes.\n");

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const replacedPaths = [];

  for (const item of candidates) {
    const label = `${item.id} (${item.name})`;
    try {
      if (!item.image_url.startsWith(publicPrefix)) {
        console.log(`skip   ${label}: URL not in ${bucketName} bucket`);
        skipped++;
        continue;
      }
      const oldPath = item.image_url.slice(publicPrefix.length);
      const fullPath = oldPath.replace(/-cat\.jpg$/, "-full.jpg");
      const newPath = oldPath.replace(/-cat\.jpg$/, "-cat2.jpg");

      const fullBuffer = await downloadObject(fullPath);
      if (!fullBuffer) {
        console.log(`skip   ${label}: full variant missing (${fullPath})`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`would  ${label}: ${fullPath} -> ${newPath}`);
        updated++;
        continue;
      }

      const resized = await sharp(fullBuffer)
        .rotate()
        .resize({
          width: CATALOG_MAX,
          height: CATALOG_MAX,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: CATALOG_QUALITY })
        .toBuffer();

      // x-upsert so a re-run after a partial failure (uploaded but DB update
      // failed) succeeds instead of erroring on "already exists".
      await uploadObject(newPath, resized);

      const newUrl = `${publicPrefix}${newPath}`;

      // item_images.thumbnail_url must move too: ItemForm rehydrates the cover
      // from it and writes it back to items.image_url on the next save.
      await sql.begin(async (tx) => {
        await tx`
          UPDATE items SET image_url = ${newUrl}
          WHERE id = ${item.id} AND image_url = ${item.image_url}
        `;
        await tx`
          UPDATE item_images SET thumbnail_url = ${newUrl}
          WHERE item_id = ${item.id} AND thumbnail_url = ${item.image_url}
        `;
      });

      replacedPaths.push(oldPath);
      console.log(`done   ${label}: ${newPath}`);
      updated++;
    } catch (err) {
      console.error(`FAIL   ${label}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(
    `\n${dryRun ? "Would update" : "Updated"} ${updated}, skipped ${skipped}, failed ${failed}.`,
  );
  if (replacedPaths.length > 0) {
    console.log(
      "\nReplaced 400px covers (kept in storage; safe to delete once verified):",
    );
    for (const path of replacedPaths) console.log(`  ${path}`);
  }

  await sql.end();
  if (candidates.length > 0 && updated === 0 && failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error("Backfill failed:", err);
  await sql.end();
  process.exit(1);
});
