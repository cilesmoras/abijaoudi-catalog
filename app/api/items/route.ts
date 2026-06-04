import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, items } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
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

export async function GET() {
  const data = await db
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
    .orderBy(asc(items.name));

  return Response.json(data.map(mapItemRow));
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
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

  const [created] = await db
    .insert(items)
    .values({
      name,
      description,
      price: Number(price),
      categoryId: category_id || null,
      imageUrl: image_url || null,
      thumbnailUrl: thumbnail_url || null,
    })
    .returning({
      id: items.id,
      category_id: items.categoryId,
      name: items.name,
      description: items.description,
      price: items.price,
      image_url: items.imageUrl,
      thumbnail_url: items.thumbnailUrl,
      created_at: items.createdAt,
    });

  const [withCategory] = await db
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
    .where(eq(items.id, created.id));

  return Response.json(mapItemRow(withCategory), { status: 201 });
}
