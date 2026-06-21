// Handles live at the root path (cataloo.app/<handle>), so they must never
// collide with real app routes or metadata files. Literal route segments win
// over the dynamic [handle] segment by Next.js precedence, but we still block
// these names so users can't claim confusing or future-reserved handles.
export const RESERVED_HANDLES = new Set([
  "login",
  "signup",
  "signin",
  "signout",
  "logout",
  "dashboard",
  "admin",
  "api",
  "auth",
  "onboarding",
  "forgot-password",
  "reset-password",
  "settings",
  "account",
  "about",
  "pricing",
  "terms",
  "privacy",
  "help",
  "support",
  "contact",
  "blog",
  "app",
  "www",
  "static",
  "assets",
  "public",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  "icon",
  "apple-icon",
]);

const HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

export function normalizeHandle(input: string): string {
  return input.trim().toLowerCase();
}

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle);
}

/**
 * Validates a handle's format and reserved status (does NOT check DB
 * uniqueness — callers must also check the profiles table). Returns an error
 * message, or null if valid.
 */
// Alphabet for auto-assigned Free handles: lowercase + digits, minus the
// ambiguous 0/o/1/l/i so links stay easy to read and dictate aloud.
const RANDOM_HANDLE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Generates a short random handle (default 6 chars) for new Free catalogs.
 * Custom handles are a Pro feature; everyone else gets one of these. Callers
 * must still check DB uniqueness and retry on the rare collision.
 */
export function generateRandomHandle(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += RANDOM_HANDLE_ALPHABET[
      Math.floor(Math.random() * RANDOM_HANDLE_ALPHABET.length)
    ];
  }
  return out;
}

export function validateHandle(handle: string): string | null {
  if (!HANDLE_REGEX.test(handle)) {
    return "Handle must be 3–30 characters: lowercase letters, numbers, and hyphens (no leading/trailing hyphen).";
  }
  if (isReservedHandle(handle)) {
    return "That handle is reserved. Please choose another.";
  }
  return null;
}
