import "server-only";

/**
 * Admin access is granted by an email allowlist (ADMIN_EMAILS, comma-separated)
 * rather than a DB role — there's no payment provider yet, so Pro is activated
 * by hand from the admin users page. Compare against the Supabase auth email.
 */
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
