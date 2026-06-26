"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ExportButton } from "@/components/catalog/ExportButton";
import { RequestUpgradeButton } from "@/components/dashboard/RequestUpgradeButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchCategories,
  fetchItems,
  deleteItem,
  setItemHidden,
} from "@/lib/api-client";
import type { Category, Item, Plan } from "@/lib/types";
import { FREE_ITEM_LIMIT, isPro } from "@/lib/plans";
import { formatPrice, getItemImageSrc } from "@/lib/utils";

const PAGE_SIZE = 10;
const ALL_CATEGORIES = "all";
const UNCATEGORIZED = "uncategorized";

export function ItemsManager({
  catalogName,
  currency,
  plan,
  logoUrl,
  phone,
  country,
  contactEmail,
  address,
  socials,
  upgradeRequested = false,
}: {
  catalogName: string;
  currency: string | null;
  plan: Plan;
  logoUrl: string | null;
  phone?: string | null;
  country?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  socials?: {
    facebook: string | null;
    instagram: string | null;
    tiktok: string | null;
  };
  upgradeRequested?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [itemsPayload, categoriesPayload] = await Promise.all([
          fetchItems(),
          fetchCategories(),
        ]);
        setItems(itemsPayload);
        setCategories(categoriesPayload);
      } catch {
        setError("Failed to load items");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter === UNCATEGORIZED) {
        if (item.category_id) return false;
      } else if (categoryFilter !== ALL_CATEGORIES) {
        if (item.category_id !== categoryFilter) return false;
      }
      if (query) {
        const haystack = `${item.name} ${item.description ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [items, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () =>
      filteredItems.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [filteredItems, currentPage],
  );

  const selectedItems = useMemo(() => {
    const selectedSet = new Set(selectedItemIds);
    return items.filter((item) => selectedSet.has(item.id));
  }, [items, selectedItemIds]);

  const selectionState = useMemo(() => {
    const selectedSet = new Set(selectedItemIds);
    const selectedCount = filteredItems.filter((item) =>
      selectedSet.has(item.id),
    ).length;
    const allSelected =
      filteredItems.length > 0 && selectedCount === filteredItems.length;
    return { allSelected, someSelected: selectedCount > 0 && !allSelected };
  }, [filteredItems, selectedItemIds]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectionState.someSelected;
    }
  }, [selectionState.someSelected]);

  function toggleSelected(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedItemIds(checked ? filteredItems.map((item) => item.id) : []);
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteItem(itemId);
    } catch {
      toast.error("Failed to delete item");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== itemId));
    setSelectedItemIds((current) => current.filter((id) => id !== itemId));
    toast.success("Item deleted.");
  }

  async function handleToggleHidden(item: Item) {
    try {
      const updated = await setItemHidden(item.id, !item.hidden);
      setItems((current) =>
        current.map((existing) =>
          existing.id === item.id
            ? { ...existing, hidden: updated.hidden }
            : existing,
        ),
      );
      toast.success(updated.hidden ? "Item hidden." : "Item visible.");
    } catch {
      toast.error("Failed to update item visibility");
    }
  }

  const atLimit = !isPro(plan) && items.length >= FREE_ITEM_LIMIT;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Items
            </h1>
            <p className="text-gray-600">Manage catalog product records.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isPro(plan) ? (
            <span className="text-sm text-gray-600">
              {items.length} of {FREE_ITEM_LIMIT} items
            </span>
          ) : null}
          <span className="text-sm text-gray-600">
            {selectedItems.length} selected
          </span>
          <ExportButton
            items={selectedItems}
            categories={categories}
            storeName={catalogName}
            currency={currency}
            plan={plan}
            logoUrl={logoUrl}
            phone={phone}
            country={country}
            contactEmail={contactEmail}
            address={address}
            socials={socials}
            disabled={selectedItems.length === 0}
          />
          {atLimit ? (
            <Button disabled title="Free plan item limit reached">
              New item
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/items/new">New item</Link>
            </Button>
          )}
        </div>
      </div>

      {atLimit ? (
        <p className="mb-4 inline-flex flex-wrap items-center gap-1 text-sm text-amber-600">
          You&apos;ve reached the Free plan limit of {FREE_ITEM_LIMIT} items.{" "}
          <RequestUpgradeButton
            alreadyRequested={upgradeRequested}
            className="font-medium text-amber-700 underline disabled:opacity-60"
            requestedClassName="font-medium text-emerald-600"
          />{" "}
          for unlimited items.
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search items…"
          className="sm:max-w-xs"
        />
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? <p className="text-gray-600">Loading items…</p> : null}
      {error ? <p className="mb-4 text-red-600">{error}</p> : null}

      {!loading ? (
        filteredItems.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        ref={selectAllRef}
                        data-testid="select-all"
                        type="checkbox"
                        checked={selectionState.allSelected}
                        onChange={(event) =>
                          toggleSelectAll(event.target.checked)
                        }
                        disabled={filteredItems.length === 0}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {pagedItems.map((item) => (
                    <tr key={item.id} className={item.hidden ? "opacity-60" : ""}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getItemImageSrc(
                              item.thumbnail_url ?? item.image_url,
                            )}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <span className="inline-flex items-center gap-2">
                          {item.name}
                          {item.hidden ? (
                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                              Hidden
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.categories?.name ?? "Uncategorized"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatPrice(item.price, currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.unit ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleHidden(item)}
                            title={item.hidden ? "Show item" : "Hide item"}
                          >
                            {item.hidden ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                            {item.hidden ? "Show" : "Hide"}
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/items/${item.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDelete(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                {filteredItems.length} item
                {filteredItems.length === 1 ? "" : "s"}
              </p>
              {totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        ) : items.length > 0 ? (
          <p className="text-gray-600">No items match your filters.</p>
        ) : (
          <p className="text-gray-600">No items found. Create your first item.</p>
        )
      ) : null}
    </>
  );
}
