# Supermarket Catalog

A Next.js + Supabase catalog app for managing supermarket items with:
- Public catalog page (photo, description, price)
- Category filtering and search
- Item selection and PDF export
- Admin area for managing items and categories

## Stack
- Next.js App Router
- Shadcn UI components
- Supabase (Postgres + Storage)
- jsPDF for catalog export

## Required environment variables
Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
```

## Supabase setup
1. Create table `categories` with columns:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `name` (text, not null)
   - `slug` (text, not null, unique)
   - `created_at` (timestamptz, default `now()`)
2. Create table `items` with columns:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `category_id` (uuid, nullable, references `categories.id` on delete set null)
   - `name` (text, not null)
   - `description` (text, nullable)
   - `price` (numeric, not null)
   - `image_url` (text, nullable)
   - `created_at` (timestamptz, default `now()`)
3. Create a public storage bucket named `item-images`.

## Run locally
```bash
npm install
npm run dev
```

## Drizzle ORM
- Schema: `lib/db/schema.ts`
- Config: `drizzle.config.ts`
- Initial SQL: `drizzle/0000_catalog_schema.sql`

Commands:
```bash
npm run db:generate
npm run db:push
npm run db:studio
```

## Routes
- `/` - Public catalog + PDF export
- `/admin` - Admin dashboard
- `/admin/items` - Item management
- `/admin/categories` - Category management
