import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function toIsoString(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function mapItemRow(row: {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  thumbnail_url: string | null;
  created_at: Date | string;
  categories: {
    id: string | null;
    name: string | null;
    slug: string | null;
  } | null;
}) {
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    image_url: row.image_url,
    thumbnail_url: row.thumbnail_url,
    created_at: toIsoString(row.created_at),
    categories: row.categories?.id
      ? {
          id: row.categories.id,
          name: row.categories.name!,
          slug: row.categories.slug!,
        }
      : null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [data] = await db
    .select({
      id: items.id,
      category_id: items.categoryId,
      name: items.name,
      description: items.description,
      price: items.price,
      image_url: items.imageUrl,
      thumbnail_url: items.thumbnailUrl,
      created_at: items.createdAt,
      categories: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.id, id));

  if (!data) return Response.json({ error: "Item not found" }, { status: 404 });
  return Response.json(mapItemRow(data));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, description, price, category_id, image_url, thumbnail_url } =
    body;

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
    .where(eq(items.id, id))
    .returning({ id: items.id });

  if (!updated)
    return Response.json({ error: "Item not found" }, { status: 404 });

  const [data] = await db
    .select({
      id: items.id,
      category_id: items.categoryId,
      name: items.name,
      description: items.description,
      price: items.price,
      image_url: items.imageUrl,
      thumbnail_url: items.thumbnailUrl,
      created_at: items.createdAt,
      categories: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.id, id));

  if (!data) return Response.json({ error: "Item not found" }, { status: 404 });
  return Response.json(mapItemRow(data));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(items).where(eq(items.id, id));
  return Response.json({ success: true });
}
