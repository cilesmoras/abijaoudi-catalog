"use client";

import { deleteItemAction, getItemsAction } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import type { Item } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError(null);

      try {
        const payload = await getItemsAction();
        setItems(payload);
      } catch {
        setLoading(false);
        setError("Failed to load items");
        return;
      }
      setLoading(false);
    }

    void loadItems();
  }, []);

  async function handleDelete(itemId: string) {
    if (!window.confirm("Delete this item?")) {
      return;
    }

    try {
      await deleteItemAction(itemId);
    } catch {
      setError("Failed to delete item");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Items
          </h1>
          <p className="text-gray-600">Manage catalog product records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/items/new">New item</Link>
          </Button>
        </div>
      </div>

      {loading ? <p className="text-gray-600">Loading items…</p> : null}
      {error ? <p className="mb-4 text-red-600">{error}</p> : null}

      {!loading ? (
        items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <div className="relative h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-gray-300">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.categories?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/items/${item.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">
            No items found. Create your first item.
          </p>
        )
      ) : null}
    </main>
  );
}
