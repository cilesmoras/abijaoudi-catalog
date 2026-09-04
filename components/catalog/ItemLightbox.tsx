"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cartKey, hasOptions, optionPriceRange } from "@/lib/options";
import type { Item } from "@/lib/types";
import { formatPrice, getItemImageSrc } from "@/lib/utils";

interface ItemLightboxProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string | null;
  /** Quantities keyed by cart key (item id, or `${itemId}::${optionId}`). */
  cart: Record<string, number>;
  onSetQuantity: (key: string, qty: number) => void;
  canOrder: boolean;
}

function photosFor(item: Item): string[] {
  if (item.images && item.images.length > 0) {
    return item.images.map((image) => image.url);
  }
  return [getItemImageSrc(item.image_url)];
}

export function ItemLightbox({
  item,
  open,
  onOpenChange,
  currency,
  cart,
  onSetQuantity,
  canOrder,
}: ItemLightboxProps) {
  const [index, setIndex] = useState(0);
  // Buyers must pick a choice explicitly — nothing is pre-selected.
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Reset to the first photo and clear the choice whenever a different item is
  // opened. Adjusting state during render (instead of an effect) avoids a
  // cascading re-render; the item goes null on close, so reopening resets too.
  const [prevItemId, setPrevItemId] = useState(item?.id ?? null);
  if ((item?.id ?? null) !== prevItemId) {
    setPrevItemId(item?.id ?? null);
    setIndex(0);
    setSelectedOptionId(null);
  }

  if (!item) return null;

  const photos = photosFor(item);
  const safeIndex = Math.min(index, photos.length - 1);

  const itemHasOptions = hasOptions(item);
  const options = item.options ?? [];
  const selectedOption =
    options.find((option) => option.id === selectedOptionId) ?? null;
  const key = cartKey(item.id, selectedOption?.id);
  const qty = cart[key] ?? 0;

  const range = optionPriceRange(item);
  const priceText = selectedOption
    ? formatPrice(selectedOption.price, currency)
    : range && range.min !== range.max
      ? `${formatPrice(range.min, currency)} – ${formatPrice(range.max, currency)}`
      : formatPrice(range?.min ?? item.price, currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="pr-8">{item.name}</DialogTitle>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
          <Image
            src={photos[safeIndex]}
            alt={item.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 448px"
          />
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() =>
                  setIndex((i) => (i - 1 + photos.length) % photos.length)
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => setIndex((i) => (i + 1) % photos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        {photos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded border-2 ${
                  i === safeIndex ? "border-blue-600" : "border-transparent"
                }`}
              >
                <Image
                  src={src}
                  alt={`${item.name} photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {item.categories?.name ?? "Uncategorized"}
          </span>
          {item.description ? (
            <p className="text-sm text-gray-600">{item.description}</p>
          ) : null}

          {itemHasOptions ? (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {item.options_label ?? "Options"}
              </span>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const selected = option.id === selectedOptionId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        selected
                          ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {option.name} · {formatPrice(option.price, currency)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="pt-1 text-xl font-bold text-blue-700">
            {priceText}
            {item.unit ? (
              <span className="ml-1 text-sm font-medium text-gray-500">
                / {item.unit}
              </span>
            ) : null}
          </p>
        </div>

        {canOrder ? (
          qty > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() => onSetQuantity(key, qty - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-8 text-center font-medium">{qty}</span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => onSetQuantity(key, qty + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Button
                variant="outline"
                className="w-full"
                disabled={itemHasOptions && !selectedOption}
                onClick={() => onSetQuantity(key, 1)}
              >
                Add to order
              </Button>
              {itemHasOptions && !selectedOption ? (
                <p className="text-center text-xs text-gray-500">
                  Choose a {(item.options_label ?? "option").toLowerCase()}{" "}
                  first
                </p>
              ) : null}
            </div>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
