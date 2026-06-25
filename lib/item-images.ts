import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { itemImages } from "@/lib/db/schema";
import { isPro, photoLimitFor } from "@/lib/plans";
import type { Plan } from "@/lib/types";

export type ItemImageInput = {
  url?: unknown;
  thumbnail_url?: unknown;
};

/**
 * Replaces an item's gallery photos. Only Pro persists additional photos; for
 * Free the gallery is always empty (the public lightbox falls back to the
 * compressed cover on items.image_url). Call inside the item create/update
 * routes after the item row itself is written.
 */
export async function syncItemImages(
  ownerId: string,
  itemId: string,
  plan: Plan,
  images: unknown,
): Promise<void> {
  await db.delete(itemImages).where(eq(itemImages.itemId, itemId));

  if (!isPro(plan) || !Array.isArray(images) || images.length === 0) return;

  const limit = photoLimitFor(plan);
  const capped = Number.isFinite(limit)
    ? images.slice(0, limit)
    : images;

  const rows = capped
    .map((image: ItemImageInput, index) => {
      const url = typeof image?.url === "string" ? image.url.trim() : "";
      if (!url) return null;
      const thumb =
        typeof image?.thumbnail_url === "string" ? image.thumbnail_url : null;
      return { ownerId, itemId, url, thumbnailUrl: thumb, sortOrder: index };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length > 0) await db.insert(itemImages).values(rows);
}
