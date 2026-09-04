import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const runtime = "nodejs";

function loginRedirect(origin: string, reason: string, detail?: string | null) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", reason);
  if (detail) url.searchParams.set("detail", detail);
  return NextResponse.redirect(url);
}

// Handles the OAuth / email-confirmation redirect: exchanges the `code` for a
// session, then routes the user to onboarding (no profile yet) or dashboard.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // The provider can bounce back with its own failure (e.g. the account picker
  // was dismissed). Surface that rather than reporting it as a missing code.
  const providerError = searchParams.get("error");
  if (providerError) {
    const description = searchParams.get("error_description");
    console.error("[auth/callback] provider returned an error", {
      providerError,
      description,
    });
    return loginRedirect(origin, providerError, description);
  }

  if (!code) {
    console.error("[auth/callback] callback hit without a code", {
      params: [...searchParams.keys()],
    });
    return loginRedirect(origin, "missing_code");
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      name: error?.name,
      status: error?.status,
      message: error?.message,
      hasUser: Boolean(data?.user),
    });
    return loginRedirect(origin, "auth", error?.message);
  }

  // A leading "//" would be a protocol-relative URL pointing off-site.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, data.user.id))
    .limit(1);

  return NextResponse.redirect(
    `${origin}${profile ? "/dashboard" : "/onboarding"}`,
  );
}
