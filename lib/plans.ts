import type { Plan } from "@/lib/types";

// Central source of truth for tier limits so the UI and the API agree. Keep the
// Free item limit in sync with the pricing copy on the landing page.
export const FREE_ITEM_LIMIT = 30;

// Length of a manually granted Pro term. Matches the $7/mo price. The admin
// route writes `now + PRO_TERM_DAYS` on activation; the .mjs script uses the
// equivalent SQL interval literal.
export const PRO_TERM_DAYS = 30;

export function isPro(plan: Plan): boolean {
  return plan === "pro";
}

/**
 * Whole days until the Pro term lapses. Null when not Pro or no expiry is set
 * (legacy grants). Goes negative once expired. Indicator-only — feature gates
 * still read `plan`, so an expired countdown does not revert Pro.
 */
export function proDaysRemaining(
  plan: Plan,
  proExpiresAt: string | null,
): number | null {
  if (plan !== "pro" || !proExpiresAt) return null;
  const ms = new Date(proExpiresAt).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
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

/** Max photos per item (Free is a single compressed cover; Pro is unlimited). */
export function photoLimitFor(plan: Plan): number {
  return isPro(plan) ? Infinity : 1;
}

/** Pro keeps a larger full-quality image variant; Free is compressed only. */
export function canUploadFullQuality(plan: Plan): boolean {
  return isPro(plan);
}

/** The "Made with Cataloo" badge shows on Free catalogs only. */
export function showBadge(plan: Plan): boolean {
  return !isPro(plan);
}
