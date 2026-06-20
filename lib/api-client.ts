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

export type ProfileInput = {
  handle: string;
  catalog_name: string;
  phone: string | null;
  contact_email: string | null;
  address: string | null;
};

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
