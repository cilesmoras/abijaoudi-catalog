import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { itemImages, items } from "@/lib/db/schema";
import { deleteItemImages } from "@/lib/storage";
import { categoryBelongsToOwner, getItemForOwner } from "@/lib/queries";
import { syncItemImages } from "@/lib/item-images";

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
  const {
    name,
    description,
    price,
    unit,
    category_id,
    image_url,
    thumbnail_url,
    images,
  } = body;

  if (category_id && !(await categoryBelongsToOwner(profile.id, category_id))) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  // Capture the item's current image files before mutating so we can delete any
  // that are no longer referenced after the save (cleared cover, removed gallery
  // photos, or replaced images).
  const [oldItem] = await db
    .select({ imageUrl: items.imageUrl, thumbnailUrl: items.thumbnailUrl })
    .from(items)
    .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));

  if (!oldItem)
    return Response.json({ error: "Item not found" }, { status: 404 });

  const oldGallery = await db
    .select({ url: itemImages.url, thumbnailUrl: itemImages.thumbnailUrl })
    .from(itemImages)
    .where(eq(itemImages.itemId, id));

  await db
    .update(items)
    .set({
      name,
      description,
      price: Number(price),
      unit: unit || null,
      categoryId: category_id || null,
      imageUrl: image_url || null,
      thumbnailUrl: thumbnail_url || null,
    })
    .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));

  await syncItemImages(profile.id, id, profile.plan, images);

  // Delete storage objects that are no longer referenced by this item. Diffing
  // the old URLs against the new payload cleans up cleared/removed/replaced
  // images while leaving reordered or unchanged photos untouched.
  const oldUrls = [
    oldItem.imageUrl,
    oldItem.thumbnailUrl,
    ...oldGallery.flatMap((row) => [row.url, row.thumbnailUrl]),
  ];
  const newUrls = new Set(
    [
      image_url,
      thumbnail_url,
      ...(Array.isArray(images)
        ? images.flatMap((image) => [image?.url, image?.thumbnail_url])
        : []),
    ].filter((url): url is string => typeof url === "string" && url.trim() !== ""),
  );
  const removed = oldUrls.filter(
    (url): url is string =>
      typeof url === "string" && url.trim() !== "" && !newUrls.has(url),
  );
  await deleteItemImages(...removed);

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

  // Gather gallery photo files too (the rows cascade-delete, but their storage
  // objects don't) so we can clean them up best-effort after deleting the item.
  const galleryRows = await db
    .select({ url: itemImages.url, thumbnailUrl: itemImages.thumbnailUrl })
    .from(itemImages)
    .where(eq(itemImages.itemId, id));

  await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));
  await deleteItemImages(
    item.imageUrl,
    item.thumbnailUrl,
    ...galleryRows.flatMap((row) => [row.url, row.thumbnailUrl]),
  );

  return Response.json({ success: true });
}
