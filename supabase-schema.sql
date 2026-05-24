-- Run this once in the Supabase SQL editor to set up the catalog schema.
-- ⚠️  Drizzle connects directly via DATABASE_URL (bypasses RLS).
--     RLS policies below protect the Supabase JS client only.

-- ─── Categories ──────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Allow public read on categories" on public.categories;
drop policy if exists "Allow all operations for authenticated users on categories" on public.categories;

create policy "Allow public read on categories"
  on public.categories for select using (true);

create policy "Allow all on categories"
  on public.categories for all using (true) with check (true);


-- ─── Items ───────────────────────────────────────────────────────────────────
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name        text not null,
  description text,
  price       numeric(10, 2) not null,
  image_url   text,
  created_at  timestamptz not null default now()
);

alter table public.items enable row level security;

drop policy if exists "Allow public read on items" on public.items;
drop policy if exists "Allow all operations for authenticated users on items" on public.items;

create policy "Allow public read on items"
  on public.items for select using (true);

create policy "Allow all on items"
  on public.items for all using (true) with check (true);


-- ─── Storage bucket ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "Allow public reads on item-images" on storage.objects;
drop policy if exists "Allow authenticated uploads to item-images" on storage.objects;
drop policy if exists "Allow authenticated deletes from item-images" on storage.objects;

create policy "Allow public reads on item-images"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "Allow uploads to item-images"
  on storage.objects for insert
  with check (bucket_id = 'item-images');

create policy "Allow deletes from item-images"
  on storage.objects for delete
  using (bucket_id = 'item-images');
