import { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import {
  categoryBelongsToOwner,
  countItemsForOwner,
  getItemForOwner,
  getItemsForOwner,
} from "@/lib/queries";
import { syncItemImages } from "@/lib/item-images";
import { canCreateItem, FREE_ITEM_LIMIT } from "@/lib/plans";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await getItemsForOwner(profile.id));
}

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!name || price === undefined) {
    return Response.json(
      { error: "Name and price are required" },
      { status: 400 },
    );
  }

  if (category_id && !(await categoryBelongsToOwner(profile.id, category_id))) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  // Free plan caps the number of items; Pro is unlimited.
  const itemCount = await countItemsForOwner(profile.id);
  if (!canCreateItem(profile.plan, itemCount)) {
    return Response.json(
      {
        error: `You've reached the Free plan limit of ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
      },
      { status: 403 },
    );
  }

  const [created] = await db
    .insert(items)
    .values({
      ownerId: profile.id,
      name,
      description,
      price: Number(price),
      unit: unit || null,
      categoryId: category_id || null,
      imageUrl: image_url || null,
      thumbnailUrl: thumbnail_url || null,
    })
    .returning({ id: items.id });

  await syncItemImages(profile.id, created.id, profile.plan, images);

  const item = await getItemForOwner(profile.id, created.id);
  return Response.json(item, { status: 201 });
}
