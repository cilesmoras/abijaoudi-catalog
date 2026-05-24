"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Item } from "@/lib/types";
import { formatPrice, getItemImageSrc } from "@/lib/utils";
import Image from "next/image";

export function ItemCard({ item }: { item: Item }) {
  const imageSrc = getItemImageSrc(item.image_url);

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <CardContent className="flex flex-col flex-1 p-4 gap-1">
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
          {item.categories?.name ?? "Uncategorized"}
        </span>
        <h3 className="font-semibold text-gray-900 leading-tight">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-gray-500 flex-1 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-lg font-bold text-blue-700 mt-2">
          {formatPrice(item.price)}
        </p>
      </CardContent>
    </Card>
  );
}
