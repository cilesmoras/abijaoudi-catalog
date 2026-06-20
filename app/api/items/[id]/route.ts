import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { deleteItemImages } from "@/lib/storage";
import { categoryBelongsToOwner, getItemForOwner } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await getItemForOwner(profile.id, id);
  if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
  return Response.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, description, price, category_id, image_url, thumbnail_url } =
    body;

  if (category_id && !(await categoryBelongsToOwner(profile.id, category_id))) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  const [updated] = await db
    .update(items)
    .set({
      name,
      description,
      price: Number(price),
      categoryId: category_id || null,
      imageUrl: image_url || null,
      thumbnailUrl: thumbnail_url || null,
    })
    .where(and(eq(items.id, id), eq(items.ownerId, profile.id)))
    .returning({ id: items.id });

  if (!updated)
    return Response.json({ error: "Item not found" }, { status: 404 });

  const item = await getItemForOwner(profile.id, id);
  return Response.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { hidden } = body;

  if (typeof hidden !== "boolean") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const [updated] = await db
    .update(items)
    .set({ hidden })
    .where(and(eq(items.id, id), eq(items.ownerId, profile.id)))
    .returning({ id: items.id });

  if (!updated)
    return Response.json({ error: "Item not found" }, { status: 404 });

  const item = await getItemForOwner(profile.id, id);
  return Response.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [item] = await db
    .select({ imageUrl: items.imageUrl, thumbnailUrl: items.thumbnailUrl })
    .from(items)
    .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));

  if (!item) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }

  await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));
  await deleteItemImages(item.imageUrl, item.thumbnailUrl);

  return Response.json({ success: true });
}
