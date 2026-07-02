import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Navigation fallback for the dashboard home. Mirrors the title + plan badge,
 * share-link lines, and the 3-card grid in app/dashboard/page.tsx so real
 * content swaps in with minimal layout shift.
 */
export function DashboardHomeSkeleton() {
  return (
    <>
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-4 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full max-w-xs" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
