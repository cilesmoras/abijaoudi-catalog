import { NextRequest } from "next/server";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/dal";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, message } = body as {
    email?: string | null;
    message?: string;
  };

  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  if (!trimmedMessage) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const replyTo = typeof email === "string" ? email.trim() : "";
  if (replyTo && !EMAIL_RE.test(replyTo)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("Feedback email is not configured (RESEND_API_KEY/FEEDBACK_TO_EMAIL)");
    return Response.json({ error: "Could not send feedback" }, { status: 502 });
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: "Cataloo Feedback <onboarding@resend.dev>",
      to,
      // Reply goes to the sender, not the no-reply test sender. Identity below
      // comes from the authenticated profile, not this client-supplied value.
      replyTo: replyTo || undefined,
      subject: `Feedback from ${profile.catalog_name} (${profile.handle})`,
      text: [
        `From: ${replyTo || "n/a"}`,
        `Owner: ${profile.handle} (${profile.id})`,
        "",
        trimmedMessage,
      ].join("\n"),
    });

    if (error) {
      console.error("Resend failed to send feedback:", error);
      return Response.json({ error: "Could not send feedback" }, { status: 502 });
    }
  } catch (err) {
    console.error("Unexpected error sending feedback:", err);
    return Response.json({ error: "Could not send feedback" }, { status: 502 });
  }

  return Response.json({ success: true });
}
