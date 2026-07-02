import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Navigation fallback for the analytics page (Pro). Mirrors the title,
 * two stat cards, and two chart cards in app/dashboard/analytics/page.tsx.
 */
export function AnalyticsSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-3 h-4 w-24" />

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, row) => (
                  <Skeleton key={row} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
