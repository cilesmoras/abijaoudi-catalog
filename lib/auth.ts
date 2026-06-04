import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export {
  SESSION_COOKIE,
  createSessionToken,
  verifyCredentials,
  sessionCookieOptions,
} from "@/lib/session";

/**
 * Reads and verifies the session cookie. Use in Server Components,
 * Server Actions, and Route Handlers.
 */
export async function isAuthenticated() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * Throws if the current request is not authenticated. Call at the top of
 * every mutating Server Action / Route Handler.
 */
export async function requireAuth() {
  if (!(await isAuthenticated())) {
    throw new Error("Unauthorized");
  }
}
