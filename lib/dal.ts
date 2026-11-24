import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { eq, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/lib/types";

/**
 * Returns the authenticated Supabase user, validating the JWT with the auth
 * server (never trust getSession() alone in server code). Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

function mapProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    handle: row.handle,
    catalog_name: row.catalogName,
    phone: row.phone,
    country: row.country,
    contact_email: row.contactEmail,
    address: row.address,
    currency: row.currency,
    plan: row.plan === "pro" ? "pro" : "free",
    pro_expires_at: row.proExpiresAt ? row.proExpiresAt.toISOString() : null,
    upgrade_requested_at: row.upgradeRequestedAt
      ? row.upgradeRequestedAt.toISOString()
      : null,
    upgrade_request_message: row.upgradeRequestMessage,
    logo_url: row.logoUrl,
    facebook_url: row.facebookUrl,
    instagram_url: row.instagramUrl,
    tiktok_url: row.tiktokUrl,
    offers_delivery: row.offersDelivery,
    offers_pickup: row.offersPickup,
    delivery_payment_upfront: row.deliveryPaymentUpfront,
    delivery_payment_cod: row.deliveryPaymentCod,
    delivery_fee: row.deliveryFee,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

/**
 * Loads the owner profile for the current user, or null if the user has not
 * completed onboarding (no profile row yet). Cached per request.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return row ? mapProfile(row) : null;
});

/**
 * Whether the user has an email/password credential. OAuth-only accounts
 * (Google/Facebook) have none. Read from auth.users because the Supabase user
 * object doesn't expose it reliably (setting a password on an OAuth account
 * doesn't add an "email" provider). Our server DB role can read the auth schema.
 */
export async function userHasPassword(userId: string): Promise<boolean> {
  const rows = await db.execute<{ has_password: boolean }>(sql`
    select coalesce(encrypted_password, '') <> '' as has_password
    from auth.users
    where id = ${userId}
  `);
  return rows[0]?.has_password ?? false;
}

/** Returns the current user or redirects to /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the owner profile, redirecting to /login if unauthenticated or to
 * /onboarding if the profile has not been created yet. This profile is the
 * ownership identity used to scope every catalog query.
 */
export async function requireProfile(): Promise<Profile> {
  await requireUser();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");
  return profile;
}
