"use client";

import { getCategoriesAction, getItemsAction } from "@/app/actions/catalog";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { ExportButton } from "@/components/catalog/ExportButton";
import { ItemCard } from "@/components/catalog/ItemCard";
import { Input } from "@/components/ui/input";
import type { Category, Item } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError(null);

      try {
        const [itemsPayload, categoriesPayload] = await Promise.all([
          getItemsAction(),
          getCategoriesAction(),
        ]);

        setItems(itemsPayload);
        setCategories(categoriesPayload);
      } catch {
        setError("Failed to load catalog data");
      } finally {
        setLoading(false);
      }
    }

    void loadCatalog();
  }, []);

  const filteredItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return items.filter((item) => {
      const categoryMatch =
        selectedCategory === "all" || item.category_id === selectedCategory;
      const searchMatch =
        !searchText || item.name.toLowerCase().includes(searchText);
      return categoryMatch && searchMatch;
    });
  }, [items, selectedCategory, search]);

  const selectedItems = useMemo(() => {
    const selectedSet = new Set(selectedItemIds);
    return items.filter((item) => selectedSet.has(item.id));
  }, [items, selectedItemIds]);

  const filteredSelectionState = useMemo(() => {
    const selectedSet = new Set(selectedItemIds);
    const selectedCount = filteredItems.filter((item) =>
      selectedSet.has(item.id),
    ).length;
    const allSelected =
      filteredItems.length > 0 && selectedCount === filteredItems.length;
    return {
      selectedCount,
      allSelected,
      someSelected: selectedCount > 0 && !allSelected,
    };
  }, [filteredItems, selectedItemIds]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = filteredSelectionState.someSelected;
    }
  }, [filteredSelectionState.someSelected]);

  function toggleSelected(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (checked) {
        filteredItems.forEach((item) => next.add(item.id));
      } else {
        filteredItems.forEach((item) => next.delete(item.id));
      }
      return Array.from(next);
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Supermarket Catalog
          </h1>
          <p className="mt-2 text-gray-600">
            Browse products and export selected items as a PDF.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Admin
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by item name"
          />
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              ref={selectAllRef}
              data-testid="select-all-visible"
              type="checkbox"
              checked={filteredSelectionState.allSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
              disabled={filteredItems.length === 0}
            />
            Select all visible
          </label>
        </div>
        <div className="space-y-2 md:text-right">
          <p className="text-sm text-gray-600">
            {selectedItems.length} item(s) selected for export
          </p>
          <ExportButton
            items={selectedItems}
            categories={categories}
            disabled={selectedItems.length === 0}
          />
        </div>
      </div>

      {loading ? <p className="text-gray-600">Loading catalog…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error ? (
        filteredItems.length > 0 ? (
          <section className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => {
              const checked = selectedItemIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  className={`relative rounded-xl ${checked ? "ring-2 ring-blue-600" : ""}`}
                >
                  <label className="absolute left-3 top-3 z-10 rounded-md bg-white/95 px-2 py-1 text-xs font-medium shadow-sm">
                    <input
                      type="checkbox"
                      className="mr-2 align-middle"
                      checked={checked}
                      onChange={() => toggleSelected(item.id)}
                    />
                    Select
                  </label>
                  <ItemCard item={item} />
                </article>
              );
            })}
          </section>
        ) : (
          <p className="text-gray-600">No items found for this filter.</p>
        )
      ) : null}
    </main>
  );
}
