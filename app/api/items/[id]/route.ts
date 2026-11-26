import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/dal";
import { withRLS } from "@/lib/db/rls";
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
  const item = await withRLS(profile.id, (tx) =>
    getItemForOwner(profile.id, id, tx),
  );
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

  const result = await withRLS(profile.id, async (tx) => {
    if (
      category_id &&
      !(await categoryBelongsToOwner(profile.id, category_id, tx))
    ) {
      return { error: "Invalid category", status: 400 } as const;
    }

    // Capture the item's current image files before mutating so we can delete
    // any that are no longer referenced after the save (cleared cover, removed
    // gallery photos, or replaced images).
    const [oldItem] = await tx
      .select({ imageUrl: items.imageUrl, thumbnailUrl: items.thumbnailUrl })
      .from(items)
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));

    if (!oldItem) return { error: "Item not found", status: 404 } as const;

    const oldGallery = await tx
      .select({ url: itemImages.url, thumbnailUrl: itemImages.thumbnailUrl })
      .from(itemImages)
      .where(
        and(eq(itemImages.itemId, id), eq(itemImages.ownerId, profile.id)),
      );

    await tx
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

    await syncItemImages(profile.id, id, profile.plan, images, tx);

    const item = await getItemForOwner(profile.id, id, tx);
    return { item, oldItem, oldGallery };
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { item, oldItem, oldGallery } = result;

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
    ].filter(
      (url): url is string => typeof url === "string" && url.trim() !== "",
    ),
  );
  const removed = oldUrls.filter(
    (url): url is string =>
      typeof url === "string" && url.trim() !== "" && !newUrls.has(url),
  );
  await deleteItemImages(...removed);

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

  const item = await withRLS(profile.id, async (tx) => {
    const [updated] = await tx
      .update(items)
      .set({ hidden })
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)))
      .returning({ id: items.id });
    if (!updated) return null;
    return getItemForOwner(profile.id, id, tx);
  });

  if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
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

  const deleted = await withRLS(profile.id, async (tx) => {
    const [item] = await tx
      .select({ imageUrl: items.imageUrl, thumbnailUrl: items.thumbnailUrl })
      .from(items)
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));
    if (!item) return null;

    // Gather gallery photo files too (the rows cascade-delete, but their
    // storage objects don't) so we can clean them up after the delete commits.
    const galleryRows = await tx
      .select({ url: itemImages.url, thumbnailUrl: itemImages.thumbnailUrl })
      .from(itemImages)
      .where(
        and(eq(itemImages.itemId, id), eq(itemImages.ownerId, profile.id)),
      );

    await tx
      .delete(items)
      .where(and(eq(items.id, id), eq(items.ownerId, profile.id)));
    return { item, galleryRows };
  });

  if (!deleted) {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }
  const { item, galleryRows } = deleted;

  await deleteItemImages(
    item.imageUrl,
    item.thumbnailUrl,
    ...galleryRows.flatMap((row) => [row.url, row.thumbnailUrl]),
  );

  return Response.json({ success: true });
}
