"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Item } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

export function ItemCard({ item }: { item: Item }) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative aspect-square bg-gray-50">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <CardContent className="flex flex-col flex-1 p-4 gap-1">
        {item.categories && (
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
            {item.categories.name}
          </span>
        )}
        <h3 className="font-semibold text-gray-900 leading-tight">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-gray-500 flex-1 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-lg font-bold text-emerald-700 mt-2">
          {formatPrice(item.price)}
        </p>
      </CardContent>
    </Card>
  );
}
