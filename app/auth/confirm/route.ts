import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

// Verifies email confirmation / password-recovery links (token_hash + type).
// Supabase sends users here from the confirmation and reset emails.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // Recovery links should land on the password reset form.
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  const target = next && next.startsWith("/") ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${target}`);
}
