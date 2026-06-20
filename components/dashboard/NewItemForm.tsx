"use client";

import { useEffect, useState } from "react";
import { ItemForm, type ItemFormValues } from "@/components/admin/ItemForm";
import { BackLink } from "@/components/dashboard/BackLink";
import { createItem, fetchCategories } from "@/lib/api-client";
import type { Category } from "@/lib/types";

export function NewItemForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError("Failed to load categories"));
  }, []);

  async function handleSubmit(values: ItemFormValues) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await createItem(values);
      setSuccess(true);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <BackLink href="/dashboard/items" label="Back to items" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create item
        </h1>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="mb-4 text-sm text-green-600">Item created successfully.</p>
      ) : null}

      <ItemForm
        key={formKey}
        categories={categories}
        submitLabel="Create item"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </>
  );
}
