"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Minus, Plus, MessageCircle } from "lucide-react";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Category, Item, Profile } from "@/lib/types";
import { formatPrice, getItemImageSrc } from "@/lib/utils";

interface PublicCatalogProps {
  profile: Profile;
  items: Item[];
  categories: Category[];
}

export function PublicCatalog({ profile, items, categories }: PublicCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

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
        .filter((entry): entry is { item: Item; qty: number } => entry !== null),
    [cart, items],
  );

  const totalCount = cartEntries.reduce((sum, e) => sum + e.qty, 0);
  const totalPrice = cartEntries.reduce(
    (sum, e) => sum + e.qty * e.item.price,
    0,
  );

  const phoneDigits = (profile.phone ?? "").replace(/\D/g, "");

  function orderOnWhatsApp() {
    if (!phoneDigits || cartEntries.length === 0) return;
    const lines = cartEntries.map(
      (e) => `• ${e.qty}x ${e.item.name} (${formatPrice(e.item.price)})`,
    );
    const message = [
      `Hi ${profile.catalog_name}, I'd like to order:`,
      "",
      ...lines,
      "",
      `Total: ${formatPrice(totalPrice)}`,
    ].join("\n");
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
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

      {filteredItems.length > 0 ? (
        <section className="grid grid-cols-2 gap-5 pb-28 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const qty = cart[item.id] ?? 0;
            return (
              <Card key={item.id} className="flex h-full flex-col overflow-hidden">
                <div className="relative aspect-square bg-gray-50">
                  <Image
                    src={getItemImageSrc(item.image_url)}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <CardContent className="flex flex-1 flex-col gap-1 p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    {item.categories?.name ?? "Uncategorized"}
                  </span>
                  <h3 className="font-semibold leading-tight text-gray-900">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="line-clamp-2 flex-1 text-sm text-gray-500">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-lg font-bold text-blue-700">
                    {formatPrice(item.price)}
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

      {phoneDigits && totalCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">{totalCount}</span> item
              {totalCount === 1 ? "" : "s"} ·{" "}
              <span className="font-semibold">{formatPrice(totalPrice)}</span>
            </div>
            <Button onClick={orderOnWhatsApp} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Order on WhatsApp
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
