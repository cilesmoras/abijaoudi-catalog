import { Skeleton } from "@/components/ui/skeleton";

/**
 * Navigation fallback shared by the new/edit item pages. Mirrors the header
 * (back link + title) and the stacked fields of ItemForm — name, description,
 * price, unit, category, image, submit — so real content swaps in with minimal
 * layout shift.
 */
export function ItemFormSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Price */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        {/* Unit */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
        </div>
        {/* Category */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        {/* Image */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-28 w-28 rounded-md" />
        </div>
        {/* Submit */}
        <Skeleton className="h-9 w-32" />
      </div>
    </>
  );
}
