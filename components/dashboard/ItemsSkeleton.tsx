import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = ["Photo", "Name", "Category", "Price", "Unit"] as const;

/**
 * Streaming fallback for the items dashboard. Mirrors the header controls,
 * search/filter row, and table in ItemsManager so real data swaps in with
 * minimal layout shift.
 */
export function ItemsSkeleton() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Items
          </h1>
          <p className="text-gray-600">Manage catalog product records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        <Skeleton className="h-9 w-full sm:w-56" />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-4" />
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                >
                  {column}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                <td className="px-4 py-2">
                  <Skeleton className="h-4 w-4" />
                </td>
                <td className="px-4 py-2">
                  <Skeleton className="h-10 w-10 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-12" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-14" />
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
