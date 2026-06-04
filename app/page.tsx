"use client";

import { getCategoriesAction, getItemsAction } from "@/app/actions/catalog";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { ItemCard } from "@/components/catalog/ItemCard";
import { Input } from "@/components/ui/input";
import type { Category, Item } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Supermarket Catalog
          </h1>
          <p className="mt-2 text-gray-600">Browse products in the catalog.</p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Admin
        </Link>
      </div>

      <div className="mb-6 space-y-3">
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
      </div>

      {loading ? <p className="text-gray-600">Loading catalog…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error ? (
        filteredItems.length > 0 ? (
          <section className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="relative rounded-xl">
                <ItemCard item={item} />
              </article>
            ))}
          </section>
        ) : (
          <p className="text-gray-600">No items found for this filter.</p>
        )
      ) : null}
    </main>
  );
}
