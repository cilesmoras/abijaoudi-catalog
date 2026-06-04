import { createClient } from "@/utils/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Methods that only read data and are safe to leave public on the API.
const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function proxy(request: NextRequest) {
  // Preserve the existing Supabase auth cookie refresh behavior.
  const supabaseResponse = createClient(request);

  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isUpload = pathname.startsWith("/api/upload");
  const isProtectedApi =
    isUpload ||
    pathname.startsWith("/api/items") ||
    pathname.startsWith("/api/categories");

  if (!isAdminPage && !isProtectedApi) {
    return supabaseResponse;
  }

  const authed = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (authed) {
    return supabaseResponse;
  }

  // The catalog reads items/categories publicly — allow safe reads through.
  if (isProtectedApi && !isUpload && READ_METHODS.has(request.method)) {
    return supabaseResponse;
  }

  if (isProtectedApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Page request → send to login, preserving where they were headed.
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
