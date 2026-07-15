"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  deleteItemAction,
  setItemHiddenAction,
} from "@/app/dashboard/items/actions";
import { ExportButton } from "@/components/catalog/ExportButton";
import { ItemActionsMenu } from "@/components/dashboard/ItemActionsMenu";
import { RequestUpgradeButton } from "@/components/dashboard/RequestUpgradeButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Item, Plan } from "@/lib/types";
import { FREE_ITEM_LIMIT, isPro } from "@/lib/plans";
import { optionPriceRange } from "@/lib/options";
import { cn, formatPrice, getItemImageSrc } from "@/lib/utils";

// Items with options show their choice-price range; plain items a single price.
function priceLabel(item: Item, currency: string | null) {
  const range = optionPriceRange(item);
  if (!range) return formatPrice(item.price, currency);
  return range.min === range.max
    ? formatPrice(range.min, currency)
    : `${formatPrice(range.min, currency)} – ${formatPrice(range.max, currency)}`;
}

const PAGE_SIZE = 10;
const ALL_CATEGORIES = "all";
const UNCATEGORIZED = "uncategorized";

type OptimisticAction =
  | { type: "remove"; id: string }
  | { type: "toggleHidden"; id: string };

function itemsReducer(state: Item[], action: OptimisticAction): Item[] {
  switch (action.type) {
    case "remove":
      return state.filter((item) => item.id !== action.id);
    case "toggleHidden":
      return state.map((item) =>
        item.id === action.id ? { ...item, hidden: !item.hidden } : item,
      );
  }
}

export function ItemsManager({
  initialItems,
  initialCategories,
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
  initialItems: Item[];
  initialCategories: Category[];
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
  const categories = initialCategories;
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const mobileSelectAllRef = useRef<HTMLInputElement | null>(null);

  // Seeded from server-fetched data; optimistic edits reconcile to the
  // revalidated server state once each action resolves (or revert on error).
  const [items, applyOptimistic] = useOptimistic(initialItems, itemsReducer);

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
    for (const ref of [selectAllRef, mobileSelectAllRef]) {
      if (ref.current) {
        ref.current.indeterminate = selectionState.someSelected;
      }
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

  function requestDelete(item: Item) {
    setDeleteTarget(item);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const itemId = deleteTarget.id;
    setDeleteTarget(null);
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: itemId });
      setSelectedItemIds((current) => current.filter((id) => id !== itemId));
      const result = await deleteItemAction(itemId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Item deleted.");
      }
    });
  }

  function handleToggleHidden(item: Item) {
    startTransition(async () => {
      applyOptimistic({ type: "toggleHidden", id: item.id });
      const result = await setItemHiddenAction(item.id, !item.hidden);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(result.data.hidden ? "Item hidden." : "Item visible.");
      }
    });
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

      {filteredItems.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
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
                      {priceLabel(item, currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.unit ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ItemActionsMenu
                        item={item}
                        disabled={isPending}
                        onToggleHidden={handleToggleHidden}
                        onRequestDelete={requestDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            <div className="mb-2 flex items-center gap-2 px-1">
              <input
                ref={mobileSelectAllRef}
                type="checkbox"
                className="h-4 w-4"
                checked={selectionState.allSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
              />
              <span className="text-sm text-gray-600">
                Select all ({filteredItems.length})
              </span>
            </div>
            <ul className="space-y-2">
              {pagedItems.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-white p-3",
                    item.hidden && "opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-4 h-4 w-4 shrink-0"
                    checked={selectedItemIds.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getItemImageSrc(item.thumbnail_url ?? item.image_url)}
                    alt={item.name}
                    className="h-12 w-12 shrink-0 rounded-md bg-gray-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                      {item.hidden ? (
                        <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                          Hidden
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {item.categories?.name ?? "Uncategorized"}
                      {item.unit ? ` · ${item.unit}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {priceLabel(item, currency)}
                    </p>
                  </div>
                  <ItemActionsMenu
                    item={item}
                    disabled={isPending}
                    onToggleHidden={handleToggleHidden}
                    onRequestDelete={requestDelete}
                  />
                </li>
              ))}
            </ul>
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
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            &ldquo;{deleteTarget?.name}&rdquo; will be permanently removed from
            your catalog.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
