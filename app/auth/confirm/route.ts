import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

// Lands email confirmation / password-recovery links. Supabase can send two
// shapes, depending on the email template:
//   1. ?token_hash=…&type=…  — template links straight here; works on any device.
//   2. ?code=…               — default {{ .ConfirmationURL }} template with the
//      PKCE flow our browser client uses. Only works in the browser that made
//      the request (the code verifier lives in its cookies).
// `next` carries where to go afterwards (forgot-password sets /reset-password).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const fail = (reason: string, detail?: unknown) => {
    console.error("[auth/confirm] link rejected", {
      reason,
      detail,
      params: [...searchParams.keys()],
    });
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  };

  // Supabase redirects here with its own error (e.g. otp_expired) when the
  // link was already used or is too old.
  const linkError = searchParams.get("error_code") ?? searchParams.get("error");
  if (linkError) {
    return fail("supabase_error", {
      linkError,
      description: searchParams.get("error_description"),
    });
  }

  const supabase = createClient(await cookies());
  let isRecovery = type === "recovery";

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) return fail("verify_otp", error.code ?? error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail("exchange_code", error.code ?? error.message);
    isRecovery ||= next === "/reset-password";
  } else {
    return fail("missing_params");
  }

  // Recovery links should land on the password reset form.
  if (isRecovery) {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  const target =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${target}`);
}
