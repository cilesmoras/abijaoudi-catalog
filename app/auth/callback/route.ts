import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const runtime = "nodejs";

// Handles the OAuth / email-confirmation redirect: exchanges the `code` for a
// session, then routes the user to onboarding (no profile yet) or dashboard.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (next && next.startsWith("/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, data.user.id))
    .limit(1);

  return NextResponse.redirect(`${origin}${profile ? "/dashboard" : "/onboarding"}`);
}
