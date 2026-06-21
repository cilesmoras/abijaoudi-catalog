"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ItemForm, type ItemFormValues } from "@/components/admin/ItemForm";
import { BackLink } from "@/components/dashboard/BackLink";
import { createItem, fetchCategories } from "@/lib/api-client";
import type { Category } from "@/lib/types";

export function NewItemForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  async function handleSubmit(values: ItemFormValues) {
    setSubmitting(true);
    try {
      await createItem(values);
      toast.success("Item created successfully.");
      setFormKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create item");
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
