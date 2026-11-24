/**
 * Shared password rules for every place an owner chooses a password
 * (dashboard change/set password, /reset-password). Keep this in sync with the
 * Supabase Auth "Minimum password length" setting so both layers agree.
 */
export const MIN_PASSWORD_LENGTH = 8;

/** Returns a user-facing error message, or null when the new password is OK. */
export function validateNewPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirm) {
    return "Passwords don't match.";
  }
  return null;
}
