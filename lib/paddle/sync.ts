import "server-only";
import {
  EventName,
  type EventEntity,
  type SubscriptionNotification,
} from "@paddle/paddle-node-sdk";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { paddleWebhookEvents, profiles } from "@/lib/db/schema";
import { planForSubscriptionStatus } from "@/lib/plans";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SUBSCRIPTION_EVENTS = new Set<string>([
  EventName.SubscriptionCreated,
  EventName.SubscriptionActivated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionCanceled,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
  EventName.SubscriptionResumed,
  EventName.SubscriptionTrialing,
]);

/** Outcome of applying one webhook, for logging and cache revalidation. */
export type SyncResult =
  { applied: true; handle: string } | { applied: false; reason: string };

/**
 * Applies a verified Paddle event exactly once. The event id is recorded in
 * `paddle_webhook_events` inside the same transaction as the profile write,
 * so a retry after a crash re-runs cleanly and a duplicate delivery is a no-op.
 * Runs as postgres: billing columns are not writable by app_owner.
 */
export async function processPaddleEvent(
  event: EventEntity,
): Promise<SyncResult> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(paddleWebhookEvents)
      .values({
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: new Date(event.occurredAt),
      })
      .onConflictDoNothing()
      .returning({ eventId: paddleWebhookEvents.eventId });

    if (inserted.length === 0) {
      return { applied: false, reason: "duplicate event" } as const;
    }

    let result: SyncResult = { applied: false, reason: "event not handled" };
    if (SUBSCRIPTION_EVENTS.has(event.eventType)) {
      result = await applySubscription(
        tx,
        event.data as SubscriptionNotification,
        new Date(event.occurredAt),
      );
    }

    await tx
      .update(paddleWebhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(paddleWebhookEvents.eventId, event.eventId));
    return result;
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function applySubscription(
  tx: Tx,
  sub: SubscriptionNotification,
  occurredAt: Date,
): Promise<SyncResult> {
  // Checkout attaches customData.ownerId; later events can also be matched by
  // the stored subscription or customer id. Lock the row so concurrent
  // deliveries for the same owner serialize.
  const ownerId =
    typeof sub.customData?.ownerId === "string" &&
    UUID_RE.test(sub.customData.ownerId)
      ? sub.customData.ownerId
      : null;

  const match = ownerId
    ? eq(profiles.id, ownerId)
    : or(
        eq(profiles.paddleSubscriptionId, sub.id),
        eq(profiles.paddleCustomerId, sub.customerId),
      );

  const [owner] = await tx
    .select({
      id: profiles.id,
      handle: profiles.handle,
      proSource: profiles.proSource,
      paddleSubscriptionId: profiles.paddleSubscriptionId,
      subscriptionStatus: profiles.subscriptionStatus,
      subscriptionSyncedAt: profiles.subscriptionSyncedAt,
    })
    .from(profiles)
    .where(match)
    .limit(1)
    .for("update");

  if (!owner) return { applied: false, reason: `no owner for ${sub.id}` };

  // Free-forever grants are never touched by billing.
  if (owner.proSource === "comp") {
    return { applied: false, reason: "comp account" };
  }

  const nextPlan = planForSubscriptionStatus(sub.status);

  // A different subscription is already on file. Only let this one replace
  // it if it grants Pro (e.g. a resubscribe), and the current one doesn't.
  // A late cancel for an old subscription must not downgrade a new one.
  if (owner.paddleSubscriptionId && owner.paddleSubscriptionId !== sub.id) {
    const currentIsPro =
      owner.subscriptionStatus !== null &&
      planForSubscriptionStatus(owner.subscriptionStatus) === "pro";
    if (nextPlan !== "pro" || currentIsPro) {
      return { applied: false, reason: "event for a superseded subscription" };
    }
  } else if (
    owner.subscriptionSyncedAt &&
    occurredAt <= owner.subscriptionSyncedAt
  ) {
    // Webhooks aren't ordered; ignore anything older than what we applied.
    return { applied: false, reason: "stale event" };
  }

  const interval = sub.billingCycle?.interval;
  const priceId = sub.items[0]?.price?.id ?? null;

  await tx
    .update(profiles)
    .set({
      plan: nextPlan,
      proSource: nextPlan === "pro" ? "paddle" : null,
      paddleCustomerId: sub.customerId,
      paddleSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionPriceId: priceId,
      billingInterval:
        interval === "month" || interval === "year" ? interval : null,
      currentPeriodEnd: sub.currentBillingPeriod?.endsAt
        ? new Date(sub.currentBillingPeriod.endsAt)
        : null,
      cancelAtPeriodEnd: sub.scheduledChange?.action === "cancel",
      subscriptionSyncedAt: occurredAt,
      // Paid Pro replaces the manual flow's countdown and request flags.
      proExpiresAt: null,
      ...(nextPlan === "pro"
        ? { upgradeRequestedAt: null, upgradeRequestMessage: null }
        : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(profiles.id, owner.id));

  return { applied: true, handle: owner.handle };
}
