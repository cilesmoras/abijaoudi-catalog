"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, items, settings } from "@/lib/db/schema";
import { deleteItemImages } from "@/lib/storage";
import type { Category, Item } from "@/lib/types";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ItemInput = {
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
};

function toIsoString(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function mapCategoryRow(row: {
  id: string;
  name: string;
  slug: string;
  createdAt: Date | string;
}): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    created_at: toIsoString(row.createdAt),
  };
}

function mapItemRow(row: {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  thumbnail_url: string | null;
  created_at: Date | string;
  categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
}): Item {
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    image_url: row.image_url,
    thumbnail_url: row.thumbnail_url,
    created_at: toIsoString(row.created_at),
    categories: row.categories
      ? {
          id: row.categories.id,
          name: row.categories.name,
          slug: row.categories.slug,
        }
      : null,
  };
}

export async function getCategoriesAction(): Promise<Category[]> {
  const data = await db.select().from(categories).orderBy(asc(categories.name));
  return data.map(mapCategoryRow);
}

export async function getItemsAction(): Promise<Item[]> {
  const data = await db
    .select({
      id: items.id,
      category_id: items.categoryId,
      name: items.name,
      description: items.description,
      price: items.price,
      image_url: items.imageUrl,
      thumbnail_url: items.thumbnailUrl,
      created_at: items.createdAt,
      categories: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .orderBy(asc(items.name));

  return data.map(mapItemRow);
}

export async function getItemByIdAction(id: string): Promise<Item | null> {
  const [data] = await db
    .select({
      id: items.id,
      category_id: items.categoryId,
      name: items.name,
      description: items.description,
      price: items.price,
      image_url: items.imageUrl,
      thumbnail_url: items.thumbnailUrl,
      created_at: items.createdAt,
      categories: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.id, id));

  return data ? mapItemRow(data) : null;
}

const DEFAULT_STORE_NAME = "Supermarket Catalog";

export async function getSettingsAction(): Promise<{ store_name: string }> {
  const [row] = await db.select().from(settings).limit(1);
  return { store_name: row?.storeName ?? DEFAULT_STORE_NAME };
}

export async function updateSettingsAction(storeName: string) {
  await requireAuth();
  const trimmed = storeName.trim();
  if (!trimmed) return { error: "Store name is required" };

  const [existing] = await db.select({ id: settings.id }).from(settings).limit(1);

  if (existing) {
    await db
      .update(settings)
      .set({ storeName: trimmed, updatedAt: new Date() })
      .where(eq(settings.id, existing.id));
  } else {
    await db.insert(settings).values({ storeName: trimmed });
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { data: { store_name: trimmed } };
}

export async function createCategoryAction(name: string) {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const slug = trimmed
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const [created] = await db
    .insert(categories)
    .values({ name: trimmed, slug })
    .returning();

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { data: mapCategoryRow(created) };
}

export async function deleteCategoryAction(id: string) {
  await requireAuth();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/items");
}

export async function createItemAction(input: ItemInput) {
  await requireAuth();
  if (!input.name?.trim() || input.price === undefined || !input.category_id) {
    return { error: "Name, price, and category are required" };
  }

  const [created] = await db
    .insert(items)
    .values({
      name: input.name.trim(),
      description: input.description,
      price: Number(input.price),
      categoryId: input.category_id,
      imageUrl: input.image_url,
      thumbnailUrl: input.thumbnail_url,
    })
    .returning({ id: items.id });

  revalidatePath("/");
  revalidatePath("/admin/items");
  return { id: created.id };
}

export async function updateItemAction(id: string, input: ItemInput) {
  await requireAuth();
  if (!input.name?.trim() || input.price === undefined || !input.category_id) {
    return { error: "Name, price, and category are required" };
  }

  const [updated] = await db
    .update(items)
    .set({
      name: input.name.trim(),
      description: input.description,
      price: Number(input.price),
      categoryId: input.category_id,
      imageUrl: input.image_url,
      thumbnailUrl: input.thumbnail_url,
    })
    .where(eq(items.id, id))
    .returning({ id: items.id });

  if (!updated) return { error: "Item not found" };

  revalidatePath("/");
  revalidatePath("/admin/items");
  return { id: updated.id };
}

export async function deleteItemAction(id: string) {
  await requireAuth();

  const [item] = await db
    .select({ imageUrl: items.imageUrl, thumbnailUrl: items.thumbnailUrl })
    .from(items)
    .where(eq(items.id, id));

  await db.delete(items).where(eq(items.id, id));
  await deleteItemImages(item?.imageUrl, item?.thumbnailUrl);

  revalidatePath("/");
  revalidatePath("/admin/items");
}
