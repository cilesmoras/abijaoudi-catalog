import { eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { mapProfileRow } from "@/lib/queries";
import { isPro } from "@/lib/plans";

export const runtime = "nodejs";

// A Free user asking to upgrade. We have no payment provider yet, so this just
// flags the profile so it surfaces on the admin users page; we then contact the
// owner and activate Pro by hand.
export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isPro(profile.plan)) {
    return Response.json(
      { error: "You're already on the Pro plan." },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(profiles)
    .set({ upgradeRequestedAt: new Date() })
    .where(eq(profiles.id, profile.id))
    .returning();

  return Response.json(mapProfileRow(updated));
}
