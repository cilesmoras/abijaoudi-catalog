"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/dal";
import { withRLS } from "@/lib/db/rls";
import { categories } from "@/lib/db/schema";
import { mapCategoryRow, slugify } from "@/lib/queries";
import type { Category } from "@/lib/types";

export type ActionResult<T> = { data: T } | { error: string };

/**
 * Creates a category for the current owner. Slugs are unique per owner. Returns
 * an `error` result (rather than throwing) so the client can toast and let the
 * optimistic UI revert. Server-side auth + validation is re-checked here since
 * Server Actions are reachable via direct POST, not just through our UI.
 */
export async function createCategoryAction(
  name: string,
): Promise<ActionResult<Category>> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const slug = slugify(trimmed);

  const created = await withRLS(profile.id, async (tx) => {
    // Slug uniqueness is per-owner.
    const [existing] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.ownerId, profile.id), eq(categories.slug, slug)))
      .limit(1);
    if (existing) return null;

    const [row] = await tx
      .insert(categories)
      .values({ ownerId: profile.id, name: trimmed, slug })
      .returning();
    return row;
  });

  if (!created) {
    return { error: "A category with that name already exists" };
  }

  revalidatePath("/dashboard/categories");
  return { data: mapCategoryRow(created) };
}

/**
 * Deletes a category owned by the current user. The ownership predicate scopes
 * the delete so a user can never remove another owner's category.
 */
export async function deleteCategoryAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Unauthorized" };

  const [deleted] = await withRLS(profile.id, (tx) =>
    tx
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.ownerId, profile.id)))
      .returning({ id: categories.id }),
  );

  if (!deleted) return { error: "Category not found" };

  revalidatePath("/dashboard/categories");
  return { data: { id: deleted.id } };
}
