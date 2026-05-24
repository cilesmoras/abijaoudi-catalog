"use client";

import {
  createCategoryAction,
  deleteCategoryAction,
  getCategoriesAction,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    setError(null);

    try {
      const payload = await getCategoriesAction();
      setCategories(payload);
    } catch {
      setLoading(false);
      setError("Failed to load categories");
      return;
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = await createCategoryAction(trimmedName);
    if (payload.error || !payload.data) {
      setSubmitting(false);
      setError(payload?.error ?? "Failed to create category");
      return;
    }

    setCategories((current) =>
      [...current, payload.data].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setNewCategoryName("");
    setSubmitting(false);
  }

  async function handleDelete(categoryId: string) {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      await deleteCategoryAction(categoryId);
    } catch {
      setError("Failed to delete category");
      return;
    }

    setCategories((current) => current.filter((category) => category.id !== categoryId));
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categories</h1>
          <p className="text-gray-600">Create and remove item categories.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back</Link>
        </Button>
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="New category name"
          required
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add category"}
        </Button>
      </form>

      {loading ? <p className="text-gray-600">Loading categories…</p> : null}
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        categories.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 text-sm text-gray-800">{category.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{category.slug}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="destructive" size="sm" onClick={() => void handleDelete(category.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No categories found. Add your first category.</p>
        )
      ) : null}
    </main>
  );
}
