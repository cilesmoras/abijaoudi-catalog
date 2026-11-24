"use server";

import { cookies } from "next/headers";
import { getCurrentUser, userHasPassword } from "@/lib/dal";
import { validateNewPassword } from "@/lib/password";
import { createClient } from "@/utils/supabase/server";

export type ChangePasswordInput = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordResult = { ok: true } | { error: string };

/**
 * Changes (or, for OAuth-only accounts, sets) the signed-in user's password.
 * Everything is re-checked here because Server Actions are reachable by direct
 * POST. When the account already has a password, the current one is required
 * and handed to Supabase, which rejects it if wrong (requires "Require current
 * password when updating" to be enabled in Supabase Auth settings). On success
 * every other session is revoked; this device stays signed in.
 */
export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const newPassword = String(input.newPassword ?? "");
  const confirmPassword = String(input.confirmPassword ?? "");
  const currentPassword = String(input.currentPassword ?? "");

  const invalid = validateNewPassword(newPassword, confirmPassword);
  if (invalid) return { error: invalid };

  const hasPassword = await userHasPassword(user.id);
  if (hasPassword && !currentPassword) {
    return { error: "Enter your current password." };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    ...(hasPassword ? { current_password: currentPassword } : {}),
  });

  if (error) return { error: friendlyAuthError(error) };

  // Revoke sessions on other devices (incl. stale PWA installs). Not fatal if
  // it fails — the password itself has already changed.
  const { error: signOutError } = await supabase.auth.signOut({
    scope: "others",
  });
  if (signOutError) {
    console.error("changePasswordAction: signOut(others) failed", signOutError);
  }

  return { ok: true };
}

function friendlyAuthError(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "same_password":
      return "Choose a password different from your current one.";
    case "weak_password":
      return "That password is too weak. Try a longer one.";
    case "invalid_credentials":
    case "current_password_mismatch":
    case "current_password_required":
      return "Current password is incorrect.";
    case "reauthentication_needed":
    case "session_expired":
    case "session_not_found":
      return "Please sign out and sign in again, then retry.";
  }
  if (/current password/i.test(error.message)) {
    return "Current password is incorrect.";
  }
  return "Couldn't update your password. Please try again.";
}
