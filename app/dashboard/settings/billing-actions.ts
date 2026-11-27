"use server";

import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getPaddle } from "@/lib/paddle/server";

export type PortalResult = { url: string } | { error: string };

/**
 * Mints a Paddle customer portal session for the signed-in owner. The
 * customer id is read from the owner's own profile on the server — never
 * taken from the client — so nobody can open another customer's portal.
 * Portal URLs are short-lived and authenticated; don't cache or store them.
 */
export async function createBillingPortalSession(): Promise<PortalResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const [row] = await db
    .select({
      customerId: profiles.paddleCustomerId,
      subscriptionId: profiles.paddleSubscriptionId,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!row?.customerId) {
    return { error: "No billing account yet — upgrade to Pro first." };
  }

  try {
    const session = await getPaddle().customerPortalSessions.create(
      row.customerId,
      row.subscriptionId ? [row.subscriptionId] : [],
    );
    return { url: session.urls.general.overview };
  } catch (error) {
    console.error("Paddle portal session failed:", error);
    return { error: "Could not open billing. Please try again." };
  }
}
