// Exercises the app_owner RLS policies as a real owner against another
// owner's rows. Everything runs inside one transaction that is ROLLED BACK,
// so no data changes. Usage: node scripts/test-rls.mjs
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require", onnotice: () => {} });
const ROLLBACK = Symbol("rollback");
let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
};

// Runs fn in a savepoint; returns the Postgres error code if it threw.
const attempt = async (tx, fn) => {
  try {
    await tx.savepoint(fn);
    return null;
  } catch (err) {
    return err.code ?? err.message;
  }
};

try {
  await sql.begin(async (tx) => {
    // Pick two owners: A (has items) and B (any other owner with data).
    const [a] = await tx`select owner_id id from items group by 1 order by count(*) desc limit 1`;
    const [b] = await tx`select owner_id id from items where owner_id <> ${a.id} limit 1`;
    if (!a || !b) throw new Error("Need two owners with items to test");
    const [bItem] = await tx`select id from items where owner_id = ${b.id} limit 1`;
    const [bCat] = await tx`select id from categories where owner_id = ${b.id} limit 1`;

    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: a.id, role: "authenticated" })}, true)`;
    await tx`set local role app_owner`;

    const [{ uid }] = await tx`select app_private.uid() uid`;
    check("app_private.uid() is owner A", uid === a.id);

    for (const t of ["profiles", "categories", "items", "item_images", "item_options", "catalog_events"]) {
      const col = t === "profiles" ? "id" : "owner_id";
      const [{ total, foreign }] = await tx.unsafe(
        `select count(*)::int total, count(*) filter (where ${col} <> $1)::int foreign from public.${t}`,
        [a.id],
      );
      check(`${t}: sees only own rows`, foreign === 0, `${total} visible`);
    }

    const upd = await tx`update items set name = name where id = ${bItem.id} returning id`;
    check("cannot update another owner's item", upd.length === 0);
    const del = await tx`delete from items where id = ${bItem.id} returning id`;
    check("cannot delete another owner's item", del.length === 0);

    let code = await attempt(tx, (s) =>
      s`insert into items (owner_id, name, price) values (${b.id}, 'x', 1)`);
    check("cannot insert item as another owner", code === "42501", code);

    if (bCat) {
      code = await attempt(tx, (s) =>
        s`insert into items (owner_id, category_id, name, price) values (${a.id}, ${bCat.id}, 'x', 1)`);
      check("cannot attach item to another owner's category", code === "42501", code);
    }

    code = await attempt(tx, (s) =>
      s`insert into item_images (owner_id, item_id, url, sort_order) values (${a.id}, ${bItem.id}, 'x', 99)`);
    check("cannot attach image to another owner's item", code === "42501", code);

    code = await attempt(tx, (s) => s`update profiles set plan = 'pro' where id = ${a.id}`);
    check("cannot change own plan", code === "42501", code);
    code = await attempt(tx, (s) => s`update profiles set handle = 'x' where id = ${a.id}`);
    check("cannot change own handle", code === "42501", code);
    code = await attempt(tx, (s) => s`update profiles set catalog_name = catalog_name where id = ${a.id}`);
    check("can update own safe profile field", code === null, code);

    code = await attempt(tx, (s) =>
      s`insert into catalog_events (owner_id, type) values (${a.id}, 'view')`);
    check("cannot insert analytics events", code === "42501", code);
    code = await attempt(tx, (s) => s`select 1 from auth.users limit 1`);
    check("cannot read auth.users", code === "42501", code);

    const [ins] = await tx`insert into categories (owner_id, name, slug) values (${a.id}, 'rls-test', 'rls-test-tmp') returning id`;
    check("can insert own category", Boolean(ins));

    throw ROLLBACK;
  });
} catch (err) {
  if (err !== ROLLBACK) {
    console.error("Test run error:", err.message);
    failures++;
  }
} finally {
  await sql.end();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll RLS checks passed (rolled back, no data changed)");
process.exitCode = failures ? 1 : 0;
