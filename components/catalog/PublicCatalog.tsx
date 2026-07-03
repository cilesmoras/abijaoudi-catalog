"use client";

import {
  CategorySelect,
  CategorySidebar,
} from "@/components/catalog/CategoryFilter";
import { ItemLightbox } from "@/components/catalog/ItemLightbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/api-client";
import { getDialCode } from "@/lib/countries";
import type { Category, Item, Profile } from "@/lib/types";
import { formatPrice, getItemImageSrc } from "@/lib/utils";
import { MessageCircle, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface PublicCatalogProps {
  profile: Profile;
  items: Item[];
  categories: Category[];
}

export function PublicCatalog({
  profile,
  items,
  categories,
}: PublicCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  // Record a catalog view once per mount (server ignores it unless Pro).
  useEffect(() => {
    trackEvent(profile.handle, "view");
  }, [profile.handle]);

  function openItem(item: Item) {
    setActiveItem(item);
    trackEvent(profile.handle, "item_open", item.id);
  }

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

  function setQuantity(itemId: string, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[itemId];
      else next[itemId] = quantity;
      return next;
    });
  }

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const item = items.find((i) => i.id === id);
          return item ? { item, qty } : null;
        })
        .filter(
          (entry): entry is { item: Item; qty: number } => entry !== null,
        ),
    [cart, items],
  );

  const totalCount = cartEntries.reduce((sum, e) => sum + e.qty, 0);
  const totalPrice = cartEntries.reduce(
    (sum, e) => sum + e.qty * e.item.price,
    0,
  );

  // Build the fully-qualified WhatsApp number: the owner stores a local number
  // plus a country, so prepend the country's dial code. Legacy profiles with no
  // country fall back to using the stored digits as-is (assumed international).
  const dialCode = getDialCode(profile.country);
  const nationalDigits = (profile.phone ?? "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");
  const phoneDigits = dialCode
    ? `${dialCode}${nationalDigits}`
    : nationalDigits;

  function orderOnWhatsApp() {
    if (!phoneDigits || cartEntries.length === 0) return;
    const lines = cartEntries.map(
      (e) =>
        `• ${e.qty}x ${e.item.name} (${formatPrice(e.item.price, profile.currency)})`,
    );
    const message = [
      `Hi ${profile.catalog_name}, I'd like to order:`,
      "",
      ...lines,
      "",
      `Total: ${formatPrice(totalPrice, profile.currency)}`,
    ].join("\n");
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden lg:block lg:w-56 lg:shrink-0">
          <CategorySidebar
            categories={categories}
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 space-y-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by item name"
            />
            <div className="lg:hidden">
              <CategorySelect
                categories={categories}
                selected={selectedCategory}
                onChange={setSelectedCategory}
              />
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <section className="grid justify-between gap-4 pb-28 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(150px,200px))]">
              {filteredItems.map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <Card
                    key={item.id}
                    className="flex h-full flex-col overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className="relative aspect-square w-full cursor-zoom-in bg-gray-50"
                      aria-label={`View ${item.name}`}
                    >
                      <Image
                        src={getItemImageSrc(item.image_url)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        quality={85}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 200px"
                      />
                      {item.images && item.images.length > 1 ? (
                        <span className="absolute right-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {item.images.length} photos
                        </span>
                      ) : null}
                    </button>
                    <CardContent className="flex flex-1 flex-col gap-1 p-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        {item.categories?.name ?? "Uncategorized"}
                      </span>
                      <h3
                        className="cursor-pointer font-semibold leading-tight text-gray-900 hover:text-blue-700"
                        onClick={() => openItem(item)}
                      >
                        {item.name}
                      </h3>
                      {item.description ? (
                        <p className="line-clamp-2 text-sm text-gray-500">
                          {item.description}
                        </p>
                      ) : null}
                      <p className="mt-auto pt-2 text-lg font-bold text-blue-700">
                        {formatPrice(item.price, profile.currency)}
                        {item.unit ? (
                          <span className="ml-1 text-sm font-medium text-gray-500">
                            / {item.unit}
                          </span>
                        ) : null}
                      </p>

                      {phoneDigits ? (
                        qty > 0 ? (
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label="Decrease quantity"
                              onClick={() => setQuantity(item.id, qty - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="min-w-8 text-center font-medium">
                              {qty}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label="Increase quantity"
                              onClick={() => setQuantity(item.id, qty + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={() => setQuantity(item.id, 1)}
                          >
                            Add to order
                          </Button>
                        )
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          ) : (
            <p className="text-gray-600">No items found for this filter.</p>
          )}
        </div>
      </div>

      {phoneDigits && totalCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">{totalCount}</span> item
              {totalCount === 1 ? "" : "s"} ·{" "}
              <span className="font-semibold">
                {formatPrice(totalPrice, profile.currency)}
              </span>
            </div>
            <Button onClick={orderOnWhatsApp} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Order on WhatsApp
            </Button>
          </div>
        </div>
      ) : null}

      <ItemLightbox
        item={activeItem}
        open={activeItem !== null}
        onOpenChange={(next) => {
          if (!next) setActiveItem(null);
        }}
        currency={profile.currency}
        qty={activeItem ? (cart[activeItem.id] ?? 0) : 0}
        onSetQuantity={setQuantity}
        canOrder={Boolean(phoneDigits)}
      />
    </>
  );
}
