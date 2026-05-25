"use client";

import {
  getCategoriesAction,
  getItemByIdAction,
  updateItemAction,
} from "@/app/actions/catalog";
import { ItemForm, type ItemFormValues } from "@/components/admin/ItemForm";
import { Button } from "@/components/ui/button";
import type { Category, Item } from "@/lib/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const itemId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id],
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setError("Invalid item id");
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [itemPayload, categoriesPayload] = await Promise.all([
          getItemByIdAction(itemId),
          getCategoriesAction(),
        ]);

        if (!itemPayload) {
          setLoading(false);
          setError("Item not found");
          return;
        }

        setItem(itemPayload);
        setCategories(categoriesPayload);
      } catch {
        setLoading(false);
        setError("Failed to load item data");
        return;
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [itemId]);

  async function handleSubmit(values: ItemFormValues) {
    if (!itemId) {
      setError("Invalid item id");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = await updateItemAction(itemId, values);
    if (payload.error) {
      setSubmitting(false);
      setError(payload?.error ?? "Failed to update item");
      return;
    }

    router.push("/admin/items");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Edit item
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin/items">Back to items</Link>
        </Button>
      </div>

      {loading ? <p className="text-gray-600">Loading item…</p> : null}
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {!loading && item ? (
        <ItemForm
          categories={categories}
          initialValues={{
            name: item.name,
            description: item.description,
            price: item.price,
            category_id: item.category_id,
            image_url: item.image_url,
          }}
          submitLabel="Save changes"
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : null}
    </main>
  );
}
