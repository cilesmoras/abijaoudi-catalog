import { AnalyticsSkeleton } from "@/components/dashboard/AnalyticsSkeleton";

export default function AnalyticsLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <AnalyticsSkeleton />
    </main>
  );
}
