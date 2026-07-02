"use client";

import { FormEvent, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/app/dashboard/categories/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";
import type { Category } from "@/lib/types";

type OptimisticAction =
  | { type: "add"; category: Category }
  | { type: "remove"; id: string };

function categoriesReducer(
  state: Category[],
  action: OptimisticAction,
): Category[] {
  switch (action.type) {
    case "add":
      return [...state, action.category].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    case "remove":
      return state.filter((category) => category.id !== action.id);
  }
}

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isPending, startTransition] = useTransition();

  // Seeded from server-fetched data; optimistic entries reconcile to the
  // revalidated server state once each action resolves (or revert on error).
  const [categories, applyOptimistic] = useOptimistic(
    initialCategories,
    categoriesReducer,
  );

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    setNewCategoryName("");
    startTransition(async () => {
      applyOptimistic({
        type: "add",
        category: {
          id: `optimistic-${trimmedName}`,
          owner_id: "",
          name: trimmedName,
          slug: slugify(trimmedName),
          created_at: new Date().toISOString(),
        },
      });

      const result = await createCategoryAction(trimmedName);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Category added.");
      }
    });
  }

  function handleDelete(categoryId: string) {
    if (!window.confirm("Delete this category?")) return;

    startTransition(async () => {
      applyOptimistic({ type: "remove", id: categoryId });

      const result = await deleteCategoryAction(categoryId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Category deleted.");
      }
    });
  }

  return (
    <>
      <form
        onSubmit={handleCreate}
        className="mb-6 flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="New category name"
          required
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add category"}
        </Button>
      </form>

      {categories.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Slug
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {category.slug}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">
          No categories found. Add your first category.
        </p>
      )}
    </>
  );
}
