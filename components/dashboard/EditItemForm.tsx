"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ItemForm, type ItemFormValues } from "@/components/admin/ItemForm";
import { BackLink } from "@/components/dashboard/BackLink";
import { fetchCategories, fetchItem, updateItem } from "@/lib/api-client";
import type { Category, Item } from "@/lib/types";

export function EditItemForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [itemPayload, categoriesPayload] = await Promise.all([
          fetchItem(itemId),
          fetchCategories(),
        ]);
        setItem(itemPayload);
        setCategories(categoriesPayload);
      } catch {
        setError("Failed to load item data");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [itemId]);

  async function handleSubmit(values: ItemFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      await updateItem(itemId, values);
      toast.success("Changes saved.");
      router.push("/dashboard/items");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <BackLink href="/dashboard/items" label="Back to items" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Edit item
        </h1>
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
            unit: item.unit,
            category_id: item.category_id,
            image_url: item.image_url,
            thumbnail_url: item.thumbnail_url,
          }}
          submitLabel="Save changes"
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
