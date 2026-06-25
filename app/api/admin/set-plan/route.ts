import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/dal";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const runtime = "nodejs";

type Body = { profileId?: string; plan?: string };

// Admin-only manual plan activation — the same write scripts/set-plan.mjs does,
// exposed to the admin users page. Clears the upgrade-request flag on change.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { profileId, plan } = (await request.json()) as Body;
  if (!profileId) {
    return Response.json({ error: "profileId is required" }, { status: 400 });
  }
  if (plan !== "free" && plan !== "pro") {
    return Response.json({ error: "plan must be free or pro" }, { status: 400 });
  }

  const [updated] = await db
    .update(profiles)
    .set({ plan, upgradeRequestedAt: null, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning({ id: profiles.id, handle: profiles.handle, plan: profiles.plan });

  if (!updated) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }
  return Response.json(updated);
}
