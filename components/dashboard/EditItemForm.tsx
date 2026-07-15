"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateItemAction } from "@/app/dashboard/items/actions";
import { ItemForm } from "@/components/admin/ItemForm";
import { BackLink } from "@/components/dashboard/BackLink";
import type { Category, Item, ItemFormValues, Plan } from "@/lib/types";

export function EditItemForm({
  item,
  categories,
  plan,
}: {
  item: Item;
  categories: Category[];
  plan: Plan;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: ItemFormValues) {
    setSubmitting(true);
    const result = await updateItemAction(item.id, values);
    if ("error" in result) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    toast.success("Changes saved.");
    router.push("/dashboard/items");
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <BackLink href="/dashboard/items" label="Back to items" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Edit item
        </h1>
      </div>

      <ItemForm
        categories={categories}
        plan={plan}
        initialValues={{
          name: item.name,
          description: item.description,
          price: item.price,
          unit: item.unit,
          options_label: item.options_label,
          options: item.options,
          category_id: item.category_id,
          image_url: item.image_url,
          thumbnail_url: item.thumbnail_url,
          images: item.images,
        }}
        submitLabel="Save changes"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </>
  );
}
