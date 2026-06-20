import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they handle their own auth via the DAL)
     * - _next/static, _next/image (static assets)
     * - image / metadata files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.*|apple-icon.*|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
