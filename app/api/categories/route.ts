import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function GET() {
  const data = await db.select().from(categories).orderBy(asc(categories.name));
  return Response.json(
    data.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: toIsoString(row.createdAt),
    })),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name)
    return Response.json({ error: "Name is required" }, { status: 400 });

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const [created] = await db
    .insert(categories)
    .values({ name, slug })
    .returning();

  return Response.json(
    {
      id: created.id,
      name: created.name,
      slug: created.slug,
      created_at: toIsoString(created.createdAt),
    },
    { status: 201 },
  );
}
