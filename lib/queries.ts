import "server-only";

import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, itemImages, items, profiles } from "@/lib/db/schema";
import type { Category, Item, ItemImage, Plan, Profile } from "@/lib/types";

function toIsoString(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export { slugify } from "@/lib/slug";

// Column shape for an item joined to its category preview.
const itemSelection = {
  id: items.id,
  owner_id: items.ownerId,
  category_id: items.categoryId,
  name: items.name,
  description: items.description,
  price: items.price,
  unit: items.unit,
  image_url: items.imageUrl,
  thumbnail_url: items.thumbnailUrl,
  hidden: items.hidden,
  created_at: items.createdAt,
  categories: {
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
  },
};

type ItemRow = {
  id: string;
  owner_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  hidden: boolean;
  created_at: Date | string;
  categories: { id: string | null; name: string | null; slug: string | null } | null;
};

export function mapItemRow(row: ItemRow): Item {
  return {
    id: row.id,
    owner_id: row.owner_id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    unit: row.unit,
    image_url: row.image_url,
    thumbnail_url: row.thumbnail_url,
    hidden: row.hidden,
    created_at: toIsoString(row.created_at),
    categories: row.categories?.id
      ? {
          id: row.categories.id,
          name: row.categories.name!,
          slug: row.categories.slug!,
        }
      : null,
  };
}

export function mapCategoryRow(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    owner_id: row.ownerId,
    name: row.name,
    slug: row.slug,
    created_at: toIsoString(row.createdAt),
  };
}

export function mapProfileRow(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    handle: row.handle,
    catalog_name: row.catalogName,
    phone: row.phone,
    country: row.country,
    contact_email: row.contactEmail,
    address: row.address,
    currency: row.currency,
    plan: row.plan === "pro" ? "pro" : "free",
    pro_expires_at: row.proExpiresAt ? toIsoString(row.proExpiresAt) : null,
    upgrade_requested_at: row.upgradeRequestedAt
      ? toIsoString(row.upgradeRequestedAt)
      : null,
    upgrade_request_message: row.upgradeRequestMessage,
    logo_url: row.logoUrl,
    facebook_url: row.facebookUrl,
    instagram_url: row.instagramUrl,
    tiktok_url: row.tiktokUrl,
    offers_delivery: row.offersDelivery,
    offers_pickup: row.offersPickup,
    delivery_payment_upfront: row.deliveryPaymentUpfront,
    delivery_payment_cod: row.deliveryPaymentCod,
    delivery_fee: row.deliveryFee,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

/** Loads gallery photos for the given items and attaches them, sorted. */
async function attachImages(rows: Item[]): Promise<Item[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((row) => row.id);
  const imageRows = await db
    .select({
      id: itemImages.id,
      item_id: itemImages.itemId,
      url: itemImages.url,
      thumbnail_url: itemImages.thumbnailUrl,
      sort_order: itemImages.sortOrder,
    })
    .from(itemImages)
    .where(inArray(itemImages.itemId, ids))
    .orderBy(asc(itemImages.sortOrder));

  const byItem = new Map<string, ItemImage[]>();
  for (const image of imageRows) {
    const list = byItem.get(image.item_id) ?? [];
    list.push({
      id: image.id,
      url: image.url,
      thumbnail_url: image.thumbnail_url,
      sort_order: Number(image.sort_order),
    });
    byItem.set(image.item_id, list);
  }

  return rows.map((row) => ({ ...row, images: byItem.get(row.id) ?? [] }));
}

export async function getItemsForOwner(ownerId: string): Promise<Item[]> {
  const rows = await db
    .select(itemSelection)
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.ownerId, ownerId))
    .orderBy(asc(items.name));
  return attachImages(rows.map(mapItemRow));
}

/** Total item count for an owner — used to enforce the Free plan item limit. */
export async function countItemsForOwner(ownerId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(items)
    .where(eq(items.ownerId, ownerId));
  return row?.value ?? 0;
}

/** Visible (non-hidden) items only — used for the public catalog. */
export async function getVisibleItemsForOwner(ownerId: string): Promise<Item[]> {
  const rows = await db
    .select(itemSelection)
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(and(eq(items.ownerId, ownerId), eq(items.hidden, false)))
    .orderBy(asc(items.name));
  return attachImages(rows.map(mapItemRow));
}

export async function getItemForOwner(
  ownerId: string,
  id: string,
): Promise<Item | null> {
  const [row] = await db
    .select(itemSelection)
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(and(eq(items.id, id), eq(items.ownerId, ownerId)));
  if (!row) return null;
  const [withImages] = await attachImages([mapItemRow(row)]);
  return withImages;
}

export async function getCategoriesForOwner(
  ownerId: string,
): Promise<Category[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.ownerId, ownerId))
    .orderBy(asc(categories.name));
  return rows.map(mapCategoryRow);
}

/** True if the category exists and belongs to the given owner. */
export async function categoryBelongsToOwner(
  ownerId: string,
  categoryId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.ownerId, ownerId)))
    .limit(1);
  return Boolean(row);
}

export type AdminUserRow = {
  id: string;
  handle: string;
  catalog_name: string;
  email: string | null;
  plan: Plan;
  pro_expires_at: string | null;
  upgrade_requested_at: string | null;
  upgrade_request_message: string | null;
  created_at: string;
};

/**
 * All profiles with their Supabase auth email, for the admin users page.
 * Pending upgrade requests sort first. Uses a raw join because auth.users is
 * outside Drizzle's public schema.
 */
export async function listAllProfilesForAdmin(): Promise<AdminUserRow[]> {
  const rows = await db.execute<{
    id: string;
    handle: string;
    catalog_name: string;
    email: string | null;
    plan: string;
    pro_expires_at: Date | string | null;
    upgrade_requested_at: Date | string | null;
    upgrade_request_message: string | null;
    created_at: Date | string;
  }>(sql`
    SELECT p.id, p.handle, p.catalog_name, u.email, p.plan, p.pro_expires_at,
           p.upgrade_requested_at, p.upgrade_request_message, p.created_at
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY (p.upgrade_requested_at IS NOT NULL) DESC,
             p.upgrade_requested_at DESC NULLS LAST,
             p.created_at DESC
  `);

  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    catalog_name: row.catalog_name,
    email: row.email,
    plan: row.plan === "pro" ? "pro" : "free",
    pro_expires_at: row.pro_expires_at
      ? toIsoString(row.pro_expires_at)
      : null,
    upgrade_requested_at: row.upgrade_requested_at
      ? toIsoString(row.upgrade_requested_at)
      : null,
    upgrade_request_message: row.upgrade_request_message,
    created_at: toIsoString(row.created_at),
  }));
}

export type CatalogAnalytics = {
  totalViews: number;
  totalOpens: number;
  viewsByDay: { day: string; views: number }[];
  topItems: { id: string; name: string; opens: number }[];
};

/** Pro analytics for the last 30 days: views, item opens, and top items. */
export async function getCatalogAnalytics(
  ownerId: string,
): Promise<CatalogAnalytics> {
  const totals = await db.execute<{ type: string; count: number }>(sql`
    SELECT type, count(*)::int AS count
    FROM catalog_events
    WHERE owner_id = ${ownerId} AND created_at >= now() - interval '30 days'
    GROUP BY type
  `);
  const totalViews =
    totals.find((row) => row.type === "view")?.count ?? 0;
  const totalOpens =
    totals.find((row) => row.type === "item_open")?.count ?? 0;

  const byDay = await db.execute<{ day: string; views: number }>(sql`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           count(*)::int AS views
    FROM catalog_events
    WHERE owner_id = ${ownerId} AND type = 'view'
      AND created_at >= now() - interval '30 days'
    GROUP BY 1
    ORDER BY 1
  `);

  const top = await db.execute<{ id: string; name: string; opens: number }>(sql`
    SELECT i.id, i.name, count(*)::int AS opens
    FROM catalog_events e
    JOIN items i ON i.id = e.item_id
    WHERE e.owner_id = ${ownerId} AND e.type = 'item_open'
      AND e.created_at >= now() - interval '30 days'
    GROUP BY i.id, i.name
    ORDER BY opens DESC
    LIMIT 10
  `);

  return {
    totalViews,
    totalOpens,
    viewsByDay: byDay.map((row) => ({ day: row.day, views: row.views })),
    topItems: top.map((row) => ({
      id: row.id,
      name: row.name,
      opens: row.opens,
    })),
  };
}

export async function getProfileByHandle(
  handle: string,
): Promise<Profile | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, handle))
    .limit(1);
  return row ? mapProfileRow(row) : null;
}
