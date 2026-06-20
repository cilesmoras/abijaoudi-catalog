import { and, eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.ownerId, profile.id)))
    .returning({ id: categories.id });

  if (!deleted) {
    return Response.json({ error: "Category not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
