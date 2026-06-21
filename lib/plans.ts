import type { Plan } from "@/lib/types";

// Central source of truth for tier limits so the UI and the API agree. Keep the
// Free item limit in sync with the pricing copy on the landing page.
export const FREE_ITEM_LIMIT = 30;

export function isPro(plan: Plan): boolean {
  return plan === "pro";
}

/** Max items allowed for a plan (Infinity for Pro). */
export function itemLimitFor(plan: Plan): number {
  return isPro(plan) ? Infinity : FREE_ITEM_LIMIT;
}

/** True if another item can be created given the current count. */
export function canCreateItem(plan: Plan, currentCount: number): boolean {
  return currentCount < itemLimitFor(plan);
}

/** Custom catalog handles are a Pro feature; Free users get a random one. */
export function canUseCustomHandle(plan: Plan): boolean {
  return isPro(plan);
}

/** The "Made with Cataloo" badge shows on Free catalogs only. */
export function showBadge(plan: Plan): boolean {
  return !isPro(plan);
}
