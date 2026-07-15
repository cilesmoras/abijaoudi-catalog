// Client-safe helpers for item options (menu-style variants). An item has at
// most one option group: a label on the item plus priced choices.
import type { Item } from "@/lib/types";

export const MAX_OPTIONS_PER_ITEM = 10;
export const MIN_OPTIONS_PER_ITEM = 2;

export function hasOptions(item: Item): boolean {
  return (item.options?.length ?? 0) > 0;
}

/** Min/max across choice prices; null when the item has no options. */
export function optionPriceRange(
  item: Item,
): { min: number; max: number } | null {
  if (!item.options || item.options.length === 0) return null;
  const prices = item.options.map((option) => option.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Cart keys: a plain item is keyed by its id; a chosen option by
// `${itemId}::${optionId}`. "::" cannot appear in UUIDs, so parsing is
// unambiguous.
export function cartKey(itemId: string, optionId?: string | null): string {
  return optionId ? `${itemId}::${optionId}` : itemId;
}

export function parseCartKey(key: string): {
  itemId: string;
  optionId: string | null;
} {
  const [itemId, optionId] = key.split("::");
  return { itemId, optionId: optionId ?? null };
}
