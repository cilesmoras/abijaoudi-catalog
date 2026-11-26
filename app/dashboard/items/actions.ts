"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/dal";
import { withRLS } from "@/lib/db/rls";
import { itemImages, items } from "@/lib/db/schema";
import { deleteItemImages } from "@/lib/storage";
import { syncItemImages } from "@/lib/item-images";
import { syncItemOptions, validateItemOptions } from "@/lib/item-options";
import {
  categoryBelongsToOwner,
  countItemsForOwner,
  getItemForOwner,
} from "@/lib/queries";
import { canCreateItem, FREE_ITEM_LIMIT } from "@/lib/plans";
import type { Item, ItemFormValues } from "@/lib/types";
import type { ActionResult } from "@/app/dashboard/categories/actions";

const ITEMS_PATH = "/dashboard/items";

/**
 * Creates an item for the current owner. Ports POST /api/items: validation,
 * per-owner category ownership, the Free-plan item cap, and gallery sync.
 * Returns an `{ error }` result (rather than throwing) so the form can toast.
 */
export async function createItemAction(
  values: ItemFormValues,
): Promise<ActionResult<Item>> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Unauthorized" };

  if (!values.name?.trim()) {
    return { error: "Name and price are required" };
  }

  // With options, choice prices are the pricing and items.price becomes the
  // denormalized min; without them the single price is required as before.
  const optionsResult = validateItemOptions(
    values.options_label,
    values.options,
  );
  if (!optionsResult.ok) return { error: optionsResult.error };
  if (optionsResult.minPrice === null && !Number.isFinite(values.price)) {
    return { error: "Name and price are required" };
  }

  const name = values.name.trim();
  const result = await withRLS(
    profile.id,
    async (tx): Promise<ActionResult<Item>> => {
      if (
        values.category_id &&
        !(await categoryBelongsToOwner(profile.id, values.category_id, tx))
      ) {
        return { error: "Invalid category" };
      }

      // Free plan caps the number of items; Pro is unlimited.
      const itemCount = await countItemsForOwner(profile.id, tx);
      if (!canCreateItem(profile.plan, itemCount)) {
        return {
          error: `You've reached the Free plan limit of ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
        };
      }

      const [created] = await tx
        .insert(items)
        .values({
          ownerId: profile.id,
          name,
          description: values.description,
          price: optionsResult.minPrice ?? Number(values.price),
          unit: values.unit || null,
          optionsLabel: optionsResult.label,
          categoryId: values.category_id || null,
          imageUrl: values.image_url || null,
          thumbnailUrl: values.thumbnail_url || null,
        })
        .returning({ id: items.id });

      await syncItemImages(
        profile.id,
        created.id,
        profile.plan,
        values.images,
        tx,
      );
      await syncItemOptions(profile.id, created.id, optionsResult.options, tx);

      const item = await getItemForOwner(profile.id, created.id, tx);
      if (!item) return { error: "Failed to load the created item" };
      return { data: item };
    },
  );

  if ("data" in result) revalidatePath(ITEMS_PATH);
  return result;
}

/**
 * Updates an owned item. Ports PUT /api/items/[id], including the storage diff:
 * any cover/thumbnail/gallery URL present before the save but absent from the
 * new payload is deleted from storage (cleared cover, removed/replaced photos).
 */
export async function updateItemAction(
  id: string,
  values: ItemFormValues,
): Promise<ActionResult<Item>> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Unauthorized" };

  const optionsResult = validateItemOptions(
    values.options_label,
    values.options,
  );
  if (!optionsResult.ok) return { error: optionsResult.error };
  if (optionsResult.minPrice === null && !Number.isFinite(values.price)) {
    return { error: "A price is required" };
  }

  const result = await withRLS(profile.id, async (tx) => {
    if (
      values.category_id &&
      !(await categoryBelongsToOwner(profile.id, values.category_id, tx))
    ) {
      return { error: "Invalid category" } as const;
    }

    const [oldItem] = await tx
      .select({ imageUrl: items.imageUrl, thumbnailUrl: items.thumbnailUrl })
      .from(items)
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));

    if (!oldItem) return { error: "Item not found" } as const;

    const oldGallery = await tx
      .select({ url: itemImages.url, thumbnailUrl: itemImages.thumbnailUrl })
      .from(itemImages)
      .where(
        and(eq(itemImages.itemId, id), eq(itemImages.ownerId, profile.id)),
      );

    await tx
      .update(items)
      .set({
        name: values.name,
        description: values.description,
        price: optionsResult.minPrice ?? Number(values.price),
        unit: values.unit || null,
        optionsLabel: optionsResult.label,
        categoryId: values.category_id || null,
        imageUrl: values.image_url || null,
        thumbnailUrl: values.thumbnail_url || null,
      })
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));

    await syncItemImages(profile.id, id, profile.plan, values.images, tx);
    await syncItemOptions(profile.id, id, optionsResult.options, tx);

    const item = await getItemForOwner(profile.id, id, tx);
    if (!item) return { error: "Item not found" } as const;
    return { item, oldItem, oldGallery };
  });

  if (result.error) return { error: result.error };
  const { item, oldItem, oldGallery } = result;

  // Storage cleanup runs only after the DB changes committed.
  const oldUrls = [
    oldItem.imageUrl,
    oldItem.thumbnailUrl,
    ...oldGallery.flatMap((row) => [row.url, row.thumbnailUrl]),
  ];
  const newUrls = new Set(
    [
      values.image_url,
      values.thumbnail_url,
      ...(Array.isArray(values.images)
        ? values.images.flatMap((image) => [image?.url, image?.thumbnail_url])
        : []),
    ].filter(
      (url): url is string => typeof url === "string" && url.trim() !== "",
    ),
  );
  const removed = oldUrls.filter(
    (url): url is string =>
      typeof url === "string" && url.trim() !== "" && !newUrls.has(url),
  );
  await deleteItemImages(...removed);

  revalidatePath(ITEMS_PATH);
  return { data: item };
}

/**
 * Deletes an owned item. Ports DELETE /api/items/[id]: the row cascade-deletes
 * its gallery rows, and we clean up the cover + gallery storage objects.
 */
export async function deleteItemAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Unauthorized" };

  const deleted = await withRLS(profile.id, async (tx) => {
    const [item] = await tx
      .select({ imageUrl: items.imageUrl, thumbnailUrl: items.thumbnailUrl })
      .from(items)
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));
    if (!item) return null;

    const galleryRows = await tx
      .select({ url: itemImages.url, thumbnailUrl: itemImages.thumbnailUrl })
      .from(itemImages)
      .where(
        and(eq(itemImages.itemId, id), eq(itemImages.ownerId, profile.id)),
      );

    await tx
      .delete(items)
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));
    return { item, galleryRows };
  });

  if (!deleted) return { error: "Item not found" };
  const { item, galleryRows } = deleted;

  await deleteItemImages(
    item.imageUrl,
    item.thumbnailUrl,
    ...galleryRows.flatMap((row) => [row.url, row.thumbnailUrl]),
  );

  revalidatePath(ITEMS_PATH);
  return { data: { id } };
}

/** Toggles an owned item's catalog visibility. Ports PATCH /api/items/[id]. */
export async function setItemHiddenAction(
  id: string,
  hidden: boolean,
): Promise<ActionResult<Item>> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Unauthorized" };

  const item = await withRLS(profile.id, async (tx) => {
    const [updated] = await tx
      .update(items)
      .set({ hidden })
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)))
      .returning({ id: items.id });
    if (!updated) return null;
    return getItemForOwner(profile.id, id, tx);
  });

  if (!item) return { error: "Item not found" };

  revalidatePath(ITEMS_PATH);
  return { data: item };
}
