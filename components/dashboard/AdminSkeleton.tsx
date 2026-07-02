import { Skeleton } from "@/components/ui/skeleton";

/**
 * Navigation fallback for the admin users page. Mirrors the title, subtitle,
 * and the users table in app/dashboard/admin/page.tsx.
 */
export function AdminSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-32" />
      <Skeleton className="mt-3 h-4 w-80" />

      <div className="mt-8 overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 4 }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
              <th className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                {Array.from({ length: 4 }).map((_, col) => (
                  <td key={col} className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-20" />
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
