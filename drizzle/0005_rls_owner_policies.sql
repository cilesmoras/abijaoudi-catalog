-- Per-owner RLS policies, enforced for the `app_owner` role.
--
-- Design (see AGENTS.md "Database security"):
-- * The Supabase Data API stays closed: anon/authenticated still have no
--   grants. Policies target a private NOLOGIN role, `app_owner`, that only
--   the server's postgres connection can SET ROLE into. No Supabase-issued
--   JWT can carry that role, so PostgREST can never act as it.
-- * lib/db/rls.ts `withRLS(user, fn)` opens a transaction, sets
--   request.jwt.claims = {sub, role} from the getUser()-validated user, and
--   `SET LOCAL ROLE app_owner`. app_private.uid() then returns the owner id.
-- * Until code moves onto withRLS these policies have no effect: postgres
--   bypasses RLS. Applying this migration changes no runtime behaviour.
--
-- Server-only paths that stay on postgres: public catalog reads, /api/track
-- inserts, admin, onboarding insert, handle uniqueness, Pro-only profile
-- fields (handle, logo_url, socials), plan/upgrade fields, auth.users reads.

-- ── Role ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner NOLOGIN NOINHERIT;
  END IF;
END $$;
GRANT app_owner TO postgres WITH INHERIT FALSE, SET TRUE;

GRANT USAGE ON SCHEMA public TO app_owner;

-- Supabase doesn't let `postgres` grant on the auth schema, so we read the
-- same claim auth.uid() reads, from a private schema PostgREST doesn't expose.
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO app_owner;

CREATE OR REPLACE FUNCTION app_private.uid() RETURNS uuid
  LANGUAGE sql STABLE
  SET search_path = ''
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;
REVOKE ALL ON FUNCTION app_private.uid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.uid() TO app_owner;

-- ── Indexes the policies filter on ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS item_images_owner_id_idx  ON public.item_images  (owner_id);
CREATE INDEX IF NOT EXISTS item_options_owner_id_idx ON public.item_options (owner_id);

-- ── Grants (column-level on profiles) ──────────────────────────────────────
GRANT SELECT ON public.profiles TO app_owner;
GRANT UPDATE (
  catalog_name, phone, country, contact_email, address, currency,
  offers_delivery, offers_pickup, delivery_payment_upfront,
  delivery_payment_cod, delivery_fee, updated_at
) ON public.profiles TO app_owner;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories   TO app_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items        TO app_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_images  TO app_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_options TO app_owner;
GRANT SELECT                         ON public.catalog_events TO app_owner;

-- ── Policies ────────────────────────────────────────────────────────────────
-- `(select app_private.uid())` is evaluated once per statement, not once per row.

-- profiles: read/update own row only. No insert/delete (server-only).
DROP POLICY IF EXISTS profiles_owner_select ON public.profiles;
CREATE POLICY profiles_owner_select ON public.profiles
  FOR SELECT TO app_owner
  USING (id = (select app_private.uid()));

DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
CREATE POLICY profiles_owner_update ON public.profiles
  FOR UPDATE TO app_owner
  USING (id = (select app_private.uid()))
  WITH CHECK (id = (select app_private.uid()));

-- categories
DROP POLICY IF EXISTS categories_owner_all ON public.categories;
CREATE POLICY categories_owner_all ON public.categories
  FOR ALL TO app_owner
  USING (owner_id = (select app_private.uid()))
  WITH CHECK (owner_id = (select app_private.uid()));

-- items: category (if any) must belong to the same owner.
DROP POLICY IF EXISTS items_owner_all ON public.items;
CREATE POLICY items_owner_all ON public.items
  FOR ALL TO app_owner
  USING (owner_id = (select app_private.uid()))
  WITH CHECK (
    owner_id = (select app_private.uid())
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id AND c.owner_id = (select app_private.uid())
      )
    )
  );

-- item_images / item_options: parent item must belong to the same owner.
DROP POLICY IF EXISTS item_images_owner_all ON public.item_images;
CREATE POLICY item_images_owner_all ON public.item_images
  FOR ALL TO app_owner
  USING (owner_id = (select app_private.uid()))
  WITH CHECK (
    owner_id = (select app_private.uid())
    AND EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.owner_id = (select app_private.uid())
    )
  );

DROP POLICY IF EXISTS item_options_owner_all ON public.item_options;
CREATE POLICY item_options_owner_all ON public.item_options
  FOR ALL TO app_owner
  USING (owner_id = (select app_private.uid()))
  WITH CHECK (
    owner_id = (select app_private.uid())
    AND EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_id AND i.owner_id = (select app_private.uid())
    )
  );

-- catalog_events: owners read their own analytics. Inserts stay server-only.
DROP POLICY IF EXISTS catalog_events_owner_select ON public.catalog_events;
CREATE POLICY catalog_events_owner_select ON public.catalog_events
  FOR SELECT TO app_owner
  USING (owner_id = (select app_private.uid()));
