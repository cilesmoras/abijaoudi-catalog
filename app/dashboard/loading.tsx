import { DashboardHomeSkeleton } from "@/components/dashboard/DashboardHomeSkeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <DashboardHomeSkeleton />
    </main>
  );
}
