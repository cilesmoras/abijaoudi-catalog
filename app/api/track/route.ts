import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogEvents, items, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/dal";
import { normalizeHandle } from "@/lib/handles";

export const runtime = "nodejs";

// Records a public-catalog analytics event. Events are only stored for Pro
// catalogs (Free has no analytics), and the owner's own visits are ignored.
export async function POST(request: NextRequest) {
  let body: { handle?: string; type?: string; itemId?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const type = body?.type;
  if (type !== "view" && type !== "item_open") {
    return Response.json({ ok: false }, { status: 400 });
  }

  const handle = normalizeHandle(String(body?.handle ?? ""));
  if (!handle) return Response.json({ ok: false }, { status: 400 });

  const [owner] = await db
    .select({ id: profiles.id, plan: profiles.plan })
    .from(profiles)
    .where(eq(profiles.handle, handle))
    .limit(1);
  if (!owner) return Response.json({ ok: false }, { status: 404 });

  // Only Pro catalogs accumulate analytics; silently no-op otherwise.
  if (owner.plan !== "pro") return Response.json({ ok: true });

  // Don't count the owner browsing their own catalog.
  const viewer = await getCurrentUser();
  if (viewer?.id === owner.id) return Response.json({ ok: true });

  // For item opens, only record the id if the item really belongs to the owner.
  let itemId: string | null = null;
  if (type === "item_open" && body?.itemId) {
    const [match] = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.id, body.itemId), eq(items.ownerId, owner.id)))
      .limit(1);
    itemId = match?.id ?? null;
  }

  await db.insert(catalogEvents).values({ ownerId: owner.id, type, itemId });
  return Response.json({ ok: true });
}
