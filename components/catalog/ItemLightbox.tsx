"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Item } from "@/lib/types";
import { formatPrice, getItemImageSrc } from "@/lib/utils";

interface ItemLightboxProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string | null;
  qty: number;
  onSetQuantity: (itemId: string, qty: number) => void;
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
  qty,
  onSetQuantity,
  canOrder,
}: ItemLightboxProps) {
  const [index, setIndex] = useState(0);

  // Reset to the first photo whenever a different item is opened.
  useEffect(() => {
    setIndex(0);
  }, [item?.id]);

  if (!item) return null;

  const photos = photosFor(item);
  const safeIndex = Math.min(index, photos.length - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="pr-8">{item.name}</DialogTitle>

        <div className="relative h-[45vh] max-h-[480px] min-h-[220px] w-full overflow-hidden rounded-lg bg-gray-50">
          <Image
            src={photos[safeIndex]}
            alt={item.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 640px"
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
          <p className="pt-1 text-xl font-bold text-blue-700">
            {formatPrice(item.price, currency)}
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
                onClick={() => onSetQuantity(item.id, qty - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-8 text-center font-medium">{qty}</span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Increase quantity"
                onClick={() => onSetQuantity(item.id, qty + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onSetQuantity(item.id, 1)}
            >
              Add to order
            </Button>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
