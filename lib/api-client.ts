import type { Category, Item, Profile } from "@/lib/types";
import type { ItemFormValues } from "@/components/admin/ItemForm";

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

const json = { "Content-Type": "application/json" };

export function fetchItems(): Promise<Item[]> {
  return fetch("/api/items").then((r) => parse<Item[]>(r));
}

export function fetchItem(id: string): Promise<Item> {
  return fetch(`/api/items/${id}`).then((r) => parse<Item>(r));
}

export function fetchCategories(): Promise<Category[]> {
  return fetch("/api/categories").then((r) => parse<Category[]>(r));
}

export function createItem(values: ItemFormValues): Promise<Item> {
  return fetch("/api/items", {
    method: "POST",
    headers: json,
    body: JSON.stringify(values),
  }).then((r) => parse<Item>(r));
}

export function updateItem(id: string, values: ItemFormValues): Promise<Item> {
  return fetch(`/api/items/${id}`, {
    method: "PUT",
    headers: json,
    body: JSON.stringify(values),
  }).then((r) => parse<Item>(r));
}

export function setItemHidden(id: string, hidden: boolean): Promise<Item> {
  return fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: json,
    body: JSON.stringify({ hidden }),
  }).then((r) => parse<Item>(r));
}

export function deleteItem(id: string): Promise<void> {
  return fetch(`/api/items/${id}`, { method: "DELETE" }).then((r) =>
    parse<unknown>(r),
  ) as Promise<void>;
}

export function createCategory(name: string): Promise<Category> {
  return fetch("/api/categories", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ name }),
  }).then((r) => parse<Category>(r));
}

export function deleteCategory(id: string): Promise<void> {
  return fetch(`/api/categories/${id}`, { method: "DELETE" }).then((r) =>
    parse<unknown>(r),
  ) as Promise<void>;
}

export function submitFeedback(input: {
  email: string | null;
  message: string;
}): Promise<{ success: true }> {
  return fetch("/api/feedback", {
    method: "POST",
    headers: json,
    body: JSON.stringify(input),
  }).then((r) => parse<{ success: true }>(r));
}

export type ProfileInput = {
  handle: string;
  catalog_name: string;
  phone: string | null;
  country: string | null;
  contact_email: string | null;
  address: string | null;
  currency: string | null;
  offers_delivery: boolean;
  offers_pickup: boolean;
  delivery_payment_upfront: boolean;
  delivery_payment_cod: boolean;
  delivery_fee: number | null;
  logo_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
};

// Fire-and-forget analytics ping for the public catalog. Uses sendBeacon so it
// survives navigation; the server only records events for Pro catalogs.
export function trackEvent(
  handle: string,
  type: "view" | "item_open",
  itemId?: string,
): void {
  try {
    const body = JSON.stringify({ handle, type, itemId });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: json,
        body,
        keepalive: true,
      });
    }
  } catch {
    // Analytics is best-effort; never disrupt the catalog.
  }
}

export function requestUpgrade(message?: string | null): Promise<Profile> {
  return fetch("/api/upgrade-request", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ message: message ?? null }),
  }).then((r) => parse<Profile>(r));
}

export function setUserPlan(
  profileId: string,
  plan: "free" | "pro",
): Promise<{ id: string; handle: string; plan: string }> {
  return fetch("/api/admin/set-plan", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ profileId, plan }),
  }).then((r) => parse<{ id: string; handle: string; plan: string }>(r));
}

export function createProfile(input: ProfileInput): Promise<Profile> {
  return fetch("/api/profile", {
    method: "POST",
    headers: json,
    body: JSON.stringify(input),
  }).then((r) => parse<Profile>(r));
}

export function updateProfile(input: ProfileInput): Promise<Profile> {
  return fetch("/api/profile", {
    method: "PUT",
    headers: json,
    body: JSON.stringify(input),
  }).then((r) => parse<Profile>(r));
}
