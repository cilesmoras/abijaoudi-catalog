import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/**
 * Owner-facing billing state. Kept out of `Profile` on purpose: Profile is
 * passed to public catalog pages, and Paddle ids must not reach public HTML.
 * Only ever call with the signed-in owner's own id.
 */
export type BillingState = {
  source: "paddle" | "comp" | null;
  status: string | null;
  interval: "month" | "year" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasPaddleCustomer: boolean;
};

export async function getBillingState(ownerId: string): Promise<BillingState> {
  const [row] = await db
    .select({
      proSource: profiles.proSource,
      status: profiles.subscriptionStatus,
      interval: profiles.billingInterval,
      currentPeriodEnd: profiles.currentPeriodEnd,
      cancelAtPeriodEnd: profiles.cancelAtPeriodEnd,
      paddleCustomerId: profiles.paddleCustomerId,
    })
    .from(profiles)
    .where(eq(profiles.id, ownerId))
    .limit(1);

  return {
    source:
      row?.proSource === "paddle" || row?.proSource === "comp"
        ? row.proSource
        : null,
    status: row?.status ?? null,
    interval:
      row?.interval === "month" || row?.interval === "year"
        ? row.interval
        : null,
    currentPeriodEnd: row?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    hasPaddleCustomer: Boolean(row?.paddleCustomerId),
  };
}

/** "Dec 27, 2026" — dates in billing copy. */
export function formatBillingDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
