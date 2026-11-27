import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getPaddle } from "@/lib/paddle/server";
import { processPaddleEvent } from "@/lib/paddle/sync";

export const runtime = "nodejs";

// Paddle notification destination. Only a 2xx counts as delivered; anything
// else is retried with the same event id, and processPaddleEvent dedupes it.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature") ?? "";
  // Verify against the raw bytes Paddle signed — never re-serialized JSON.
  const rawBody = await request.text();
  if (!signature || !rawBody) {
    return Response.json(
      { error: "Missing signature or body" },
      { status: 400 },
    );
  }

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Paddle webhook: PADDLE_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    // Throws on a bad signature, expired timestamp or malformed payload.
    const event = await getPaddle().webhooks.unmarshal(
      rawBody,
      secret,
      signature,
    );
    const result = await processPaddleEvent(event);

    if (result.applied) {
      revalidatePath("/dashboard", "layout");
      revalidatePath(`/${result.handle}`);
    } else {
      console.info(
        `Paddle webhook ${event.eventType} ${event.eventId}: ${result.reason}`,
      );
    }
    return Response.json({ received: true });
  } catch (err) {
    // One status for every failure: Paddle retries any non-2xx.
    console.error("Paddle webhook error:", err);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
