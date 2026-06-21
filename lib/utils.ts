import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const ITEM_IMAGE_PLACEHOLDER_SRC = "/item-placeholder.svg";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency?: string | null) {
  if (currency) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      }).format(price);
    } catch {
      // Unknown currency code — fall through to a plain formatted number.
    }
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function getItemImageSrc(imageUrl: string | null) {
  const trimmedUrl = imageUrl?.trim();
  return trimmedUrl ? trimmedUrl : ITEM_IMAGE_PLACEHOLDER_SRC;
}
