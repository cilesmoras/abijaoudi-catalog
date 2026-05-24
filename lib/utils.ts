import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const ITEM_IMAGE_PLACEHOLDER_SRC = "/item-placeholder.svg";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function getItemImageSrc(imageUrl: string | null) {
  const trimmedUrl = imageUrl?.trim();
  return trimmedUrl ? trimmedUrl : ITEM_IMAGE_PLACEHOLDER_SRC;
}
