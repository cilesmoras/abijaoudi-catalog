import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items, profiles } from "@/lib/db/schema";
import type { Category, Item, Profile } from "@/lib/types";

function toIsoString(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Column shape for an item joined to its category preview.
const itemSelection = {
  id: items.id,
  owner_id: items.ownerId,
  category_id: items.categoryId,
  name: items.name,
  description: items.description,
  price: items.price,
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
    offers_delivery: row.offersDelivery,
    offers_pickup: row.offersPickup,
    delivery_payment_upfront: row.deliveryPaymentUpfront,
    delivery_payment_cod: row.deliveryPaymentCod,
    delivery_fee: row.deliveryFee,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

export async function getItemsForOwner(ownerId: string): Promise<Item[]> {
  const rows = await db
    .select(itemSelection)
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.ownerId, ownerId))
    .orderBy(asc(items.name));
  return rows.map(mapItemRow);
}

/** Visible (non-hidden) items only — used for the public catalog. */
export async function getVisibleItemsForOwner(ownerId: string): Promise<Item[]> {
  const rows = await db
    .select(itemSelection)
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(and(eq(items.ownerId, ownerId), eq(items.hidden, false)))
    .orderBy(asc(items.name));
  return rows.map(mapItemRow);
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
  return row ? mapItemRow(row) : null;
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
