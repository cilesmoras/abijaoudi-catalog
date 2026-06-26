import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/dal";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { mapProfileRow } from "@/lib/queries";
import { isPro } from "@/lib/plans";

export const runtime = "nodejs";

// Email me when someone requests Pro. Best-effort: if Resend isn't configured or
// the send fails, the request is still recorded — the admin page is the source
// of truth, the email is just a heads-up.
async function notifyUpgradeRequest(
  handle: string,
  catalogName: string,
  ownerId: string,
  message: string | null,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO_EMAIL;
  if (!apiKey || !to) {
    console.error(
      "Upgrade-request email is not configured (RESEND_API_KEY/FEEDBACK_TO_EMAIL)",
    );
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Cataloo Upgrades <onboarding@resend.dev>",
      to,
      subject: `Pro upgrade request from ${catalogName} (${handle})`,
      text: [
        `Catalog: ${catalogName} (${handle})`,
        `Owner id: ${ownerId}`,
        "",
        message ? `Message:\n${message}` : "(no message)",
        "",
        "Activate from /dashboard/admin once payment is confirmed.",
      ].join("\n"),
    });
    if (error) console.error("Resend failed to send upgrade request:", error);
  } catch (err) {
    console.error("Unexpected error sending upgrade request:", err);
  }
}

// A Free user asking to upgrade. We have no payment provider yet, so this flags
// the profile (surfaced on the admin users page) and emails me a heads-up.
export async function POST(request: NextRequest) {
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

  let message: string | null = null;
  try {
    const body = (await request.json()) as { message?: unknown };
    if (typeof body?.message === "string") {
      const trimmed = body.message.trim().slice(0, 1000);
      message = trimmed.length ? trimmed : null;
    }
  } catch {
    // No body / invalid JSON — treat as a request with no message.
  }

  const [updated] = await db
    .update(profiles)
    .set({ upgradeRequestedAt: new Date(), upgradeRequestMessage: message })
    .where(eq(profiles.id, profile.id))
    .returning();

  await notifyUpgradeRequest(
    updated.handle,
    updated.catalogName,
    updated.id,
    message,
  );

  return Response.json(mapProfileRow(updated));
}
