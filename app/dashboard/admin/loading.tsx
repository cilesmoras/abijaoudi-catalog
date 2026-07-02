import { AdminSkeleton } from "@/components/dashboard/AdminSkeleton";

export default function AdminLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AdminSkeleton />
    </main>
  );
}
