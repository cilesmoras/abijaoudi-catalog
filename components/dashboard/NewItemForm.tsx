"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createItemAction } from "@/app/dashboard/items/actions";
import { ItemForm } from "@/components/admin/ItemForm";
import { BackLink } from "@/components/dashboard/BackLink";
import type { Category, ItemFormValues, Plan } from "@/lib/types";

export function NewItemForm({
  plan,
  categories,
}: {
  plan: Plan;
  categories: Category[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(values: ItemFormValues) {
    setSubmitting(true);
    try {
      const result = await createItemAction(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Item created successfully.");
      setFormKey((k) => k + 1);
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
        plan={plan}
        submitLabel="Create item"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </>
  );
}
