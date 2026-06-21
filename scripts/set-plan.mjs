// Manual Pro activation. Stripe isn't available in our regions yet, so Pro is
// granted by hand for now. This is the seam a payment webhook will later write
// to. Usage:
//   node scripts/set-plan.mjs --handle marias-bakery --plan pro
//   node scripts/set-plan.mjs --email owner@example.com --plan free
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const handle = getArg("handle");
const email = getArg("email");
const plan = getArg("plan");

if (!plan || !["free", "pro"].includes(plan)) {
  console.error("Provide --plan free|pro");
  process.exit(1);
}
if (!handle && !email) {
  console.error("Identify the profile with --handle <handle> or --email <email>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false, ssl: "require" });

async function main() {
  // Match by handle directly, or by email via the auth.users table that
  // profiles.id references.
  const rows = handle
    ? await sql`
        UPDATE profiles SET plan = ${plan}, updated_at = now()
        WHERE handle = ${handle}
        RETURNING handle, plan
      `
    : await sql`
        UPDATE profiles SET plan = ${plan}, updated_at = now()
        WHERE id = (SELECT id FROM auth.users WHERE email = ${email})
        RETURNING handle, plan
      `;

  if (rows.length === 0) {
    console.error("No matching profile found.");
    await sql.end();
    process.exit(1);
  }
  for (const row of rows) {
    console.log(`Set ${row.handle} -> ${row.plan}`);
  }
  await sql.end();
}

main().catch(async (err) => {
  console.error("Failed to set plan:", err);
  await sql.end();
  process.exit(1);
});
