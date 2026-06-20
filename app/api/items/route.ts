import { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import {
  categoryBelongsToOwner,
  getItemForOwner,
  getItemsForOwner,
} from "@/lib/queries";

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
  const { name, description, price, category_id, image_url, thumbnail_url } =
    body;

  if (!name || price === undefined) {
    return Response.json(
      { error: "Name and price are required" },
      { status: 400 },
    );
  }

  if (category_id && !(await categoryBelongsToOwner(profile.id, category_id))) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  const [created] = await db
    .insert(items)
    .values({
      ownerId: profile.id,
      name,
      description,
      price: Number(price),
      categoryId: category_id || null,
      imageUrl: image_url || null,
      thumbnailUrl: thumbnail_url || null,
    })
    .returning({ id: items.id });

  const item = await getItemForOwner(profile.id, created.id);
  return Response.json(item, { status: 201 });
}
