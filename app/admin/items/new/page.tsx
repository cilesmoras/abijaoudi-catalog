"use client";

import { createItemAction, getCategoriesAction } from "@/app/actions/catalog";
import { ItemForm, type ItemFormValues } from "@/components/admin/ItemForm";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NewItemPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    async function loadCategories() {
      try {
        const payload = await getCategoriesAction();
        setCategories(payload);
      } catch {
        setError("Failed to load categories");
      }
    }

    void loadCategories();
  }, []);

  async function handleSubmit(values: ItemFormValues) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const payload = await createItemAction(values);
    if (payload.error) {
      setSubmitting(false);
      setError(payload?.error ?? "Failed to create item");
      return;
    }

    setSubmitting(false);
    setSuccess(true);
    setFormKey((k) => k + 1);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create item
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin/items">Back to items</Link>
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="mb-4 text-sm text-green-600">
          Item created successfully.
        </p>
      ) : null}

      <ItemForm
        key={formKey}
        categories={categories}
        submitLabel="Create item"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
