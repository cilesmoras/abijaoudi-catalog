"use client";

import {
  CategorySelect,
  CategorySidebar,
} from "@/components/catalog/CategoryFilter";
import { ItemLightbox } from "@/components/catalog/ItemLightbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/api-client";
import { getDialCode } from "@/lib/countries";
import { hasOptions, optionPriceRange, parseCartKey } from "@/lib/options";
import type { Category, Item, ItemOption, Profile } from "@/lib/types";
import { formatPrice, getItemImageSrc } from "@/lib/utils";
import { MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
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
  const [cartOpen, setCartOpen] = useState(false);
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

  // Cart keys: bare item id for plain items, `${itemId}::${optionId}` for a
  // chosen option — mixed choices of one item are separate lines.
  function setQuantity(key: string, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[key];
      else next[key] = quantity;
      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  type CartEntry = {
    key: string;
    item: Item;
    option: ItemOption | null;
    qty: number;
  };

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .map(([key, qty]) => {
          const { itemId, optionId } = parseCartKey(key);
          const item = items.find((i) => i.id === itemId);
          if (!item) return null;
          const option = optionId
            ? (item.options?.find((o) => o.id === optionId) ?? null)
            : null;
          if (optionId && !option) return null;
          return { key, item, option, qty };
        })
        .filter((entry): entry is CartEntry => entry !== null),
    [cart, items],
  );

  const totalCount = cartEntries.reduce((sum, e) => sum + e.qty, 0);
  const totalPrice = cartEntries.reduce(
    (sum, e) => sum + e.qty * (e.option?.price ?? e.item.price),
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
    const lines = cartEntries.map((e) =>
      e.option
        ? `• ${e.qty}x ${e.item.name} — ${e.option.name} (${formatPrice(e.option.price, profile.currency)})`
        : `• ${e.qty}x ${e.item.name} (${formatPrice(e.item.price, profile.currency)})`,
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
    clearCart();
    setCartOpen(false);
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
                const itemHasOptions = hasOptions(item);
                const qty = cart[item.id] ?? 0;
                // For option items, count every chosen line of this item.
                const optionQty = itemHasOptions
                  ? Object.entries(cart).reduce(
                      (sum, [key, value]) =>
                        key.startsWith(`${item.id}::`) ? sum + value : sum,
                      0,
                    )
                  : 0;
                const range = optionPriceRange(item);
                const rangeText =
                  range && range.min !== range.max
                    ? `${formatPrice(range.min, profile.currency)} – ${formatPrice(range.max, profile.currency)}`
                    : formatPrice(range?.min ?? item.price, profile.currency);
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
                    <CardContent className="@container flex flex-1 flex-col gap-1 p-4">
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
                      {/* Ranges are wide, so the price scales with the card
                          (container query) instead of crowding narrow cells. */}
                      <p className="mt-auto pt-2 text-base font-bold text-blue-700 @[13rem]:text-lg">
                        {rangeText}
                        {item.unit ? (
                          <span className="ml-1 text-xs font-medium text-gray-500 @[13rem]:text-sm">
                            / {item.unit}
                          </span>
                        ) : null}
                      </p>

                      {phoneDigits ? (
                        itemHasOptions ? (
                          <Button
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={() => openItem(item)}
                          >
                            {optionQty > 0
                              ? `Add to order · ${optionQty} in cart`
                              : "Add to order"}
                          </Button>
                        ) : qty > 0 ? (
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
            <Button onClick={() => setCartOpen(true)}>View cart</Button>
          </div>
        </div>
      ) : null}

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md grid-rows-[auto_minmax(0,1fr)_auto]">
          <DialogHeader>
            <DialogTitle>Your order</DialogTitle>
          </DialogHeader>

          {cartEntries.length > 0 ? (
            <>
              <DialogBody>
                <ul className="divide-y">
                  {cartEntries.map(({ key, item, option, qty }) => (
                    <li key={key} className="py-3">
                      {/* The name gets the dialog's full width on its own line
                          and wraps freely, so nothing is ever truncated. Price
                          and quantity controls share the line below it. */}
                      <p className="font-medium text-gray-900">
                        {option ? `${item.name} — ${option.name}` : item.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">
                          {formatPrice(
                            (option?.price ?? item.price) * qty,
                            profile.currency,
                          )}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity(key, qty - 1)}
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
                            onClick={() => setQuantity(key, qty + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </DialogBody>

              <DialogFooter className="flex-col gap-3 sm:flex-col">
                <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice, profile.currency)}</span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="gap-2 sm:flex-1"
                    onClick={clearCart}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear cart
                  </Button>
                  <Button
                    className="gap-2 bg-whatsapp text-white hover:bg-whatsapp/90 sm:flex-1"
                    onClick={orderOnWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Order on WhatsApp
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-gray-500">
              Your cart is empty.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <ItemLightbox
        item={activeItem}
        open={activeItem !== null}
        onOpenChange={(next) => {
          if (!next) setActiveItem(null);
        }}
        currency={profile.currency}
        cart={cart}
        onSetQuantity={setQuantity}
        canOrder={Boolean(phoneDigits)}
      />
    </>
  );
}
