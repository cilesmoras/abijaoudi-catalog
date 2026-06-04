"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/auth";

export async function loginAction(username: string, password: string) {
  if (!verifyCredentials(username.trim(), password)) {
    return { error: "Invalid username or password" } as const;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return { ok: true } as const;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return { ok: true } as const;
}
