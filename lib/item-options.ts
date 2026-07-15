import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { itemOptions } from "@/lib/db/schema";
import { MAX_OPTIONS_PER_ITEM, MIN_OPTIONS_PER_ITEM } from "@/lib/options";
import type { ItemOptionValue } from "@/lib/types";

export type ItemOptionsValidation =
  | { ok: true; label: string | null; options: ItemOptionValue[]; minPrice: number | null }
  | { ok: false; error: string };

/**
 * Validates an option group from a create/update payload. An empty/missing
 * group is valid (the item is a plain single-price item). When choices are
 * present, returns the trimmed label + choices and the min choice price, which
 * the caller writes to items.price as a denormalized value.
 */
export function validateItemOptions(
  label: unknown,
  options: unknown,
): ItemOptionsValidation {
  if (!Array.isArray(options) || options.length === 0) {
    return { ok: true, label: null, options: [], minPrice: null };
  }

  const trimmedLabel = typeof label === "string" ? label.trim() : "";
  if (!trimmedLabel) {
    return { ok: false, error: "Option group label is required" };
  }
  if (options.length < MIN_OPTIONS_PER_ITEM) {
    return { ok: false, error: "Add at least two choices" };
  }
  if (options.length > MAX_OPTIONS_PER_ITEM) {
    return {
      ok: false,
      error: `Up to ${MAX_OPTIONS_PER_ITEM} choices per item`,
    };
  }

  const cleaned: ItemOptionValue[] = [];
  const seenNames = new Set<string>();
  for (const option of options) {
    const name =
      typeof (option as ItemOptionValue)?.name === "string"
        ? (option as ItemOptionValue).name.trim()
        : "";
    if (!name) return { ok: false, error: "Every choice needs a name" };
    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) {
      return { ok: false, error: "Choice names must be unique" };
    }
    seenNames.add(nameKey);

    const price = Number((option as ItemOptionValue)?.price);
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, error: "Every choice needs a valid price" };
    }
    cleaned.push({ name, price, sort_order: cleaned.length });
  }

  return {
    ok: true,
    label: trimmedLabel,
    options: cleaned,
    minPrice: Math.min(...cleaned.map((option) => option.price)),
  };
}

/**
 * Replaces an item's option choices with the validated set (delete-all then
 * insert, mirroring syncItemImages). Pass an empty array to remove the group.
 * Call inside the item create/update routes after the item row is written.
 */
export async function syncItemOptions(
  ownerId: string,
  itemId: string,
  options: ItemOptionValue[],
): Promise<void> {
  await db.delete(itemOptions).where(eq(itemOptions.itemId, itemId));

  if (options.length === 0) return;

  await db.insert(itemOptions).values(
    options.map((option, index) => ({
      ownerId,
      itemId,
      name: option.name,
      price: option.price,
      sortOrder: index,
    })),
  );
}
