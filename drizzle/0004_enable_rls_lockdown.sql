-- Lock the public schema away from Supabase's Data API (PostgREST/GraphQL).
--
-- The app reads and writes every table through Drizzle as the `postgres`
-- role, which bypasses RLS. Nothing queries tables with supabase-js, so the
-- `anon` / `authenticated` roles (used by the publishable key) need no table
-- access at all. Enabling RLS with no policies = deny-all for those roles;
-- revoking the grants is a second layer on top.
--
-- Ownership is still enforced in server code (lib/dal.ts + owner_id filters).

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Future objects created by `postgres` (our migrations) start locked too.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
