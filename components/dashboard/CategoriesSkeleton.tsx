import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming fallback for the categories list. Mirrors the add form + table
 * layout in CategoriesManager so the real data swaps in with minimal shift.
 */
export function CategoriesSkeleton() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full sm:w-32 sm:shrink-0" />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Slug
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {Array.from({ length: 4 }).map((_, index) => (
              <tr key={index}>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-16" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
