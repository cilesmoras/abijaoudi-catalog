import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
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
    contact_email: row.contactEmail,
    address: row.address,
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
