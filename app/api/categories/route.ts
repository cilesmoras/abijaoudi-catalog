import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { getCategoriesForOwner, mapCategoryRow, slugify } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await getCategoriesForOwner(profile.id));
}

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name: string = body?.name?.trim();
  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugify(name);

  // Slug uniqueness is per-owner.
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.ownerId, profile.id), eq(categories.slug, slug)))
    .limit(1);

  if (existing) {
    return Response.json(
      { error: "A category with that name already exists" },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(categories)
    .values({ ownerId: profile.id, name, slug })
    .returning();

  return Response.json(mapCategoryRow(created), { status: 201 });
}
