import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { isAdmin } from "@/lib/admin";
import { listAllProfilesForAdmin } from "@/lib/queries";
import { AdminUsersTable } from "@/components/dashboard/AdminUsersTable";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user?.email)) notFound();

  const users = await listAllProfilesForAdmin();
  const pending = users.filter(
    (u) => u.upgrade_requested_at && u.plan !== "pro",
  ).length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users</h1>
      <p className="mt-2 text-sm text-gray-600">
        Activate Pro by hand after confirming payment.{" "}
        {pending > 0 ? (
          <span className="font-medium text-amber-700">
            {pending} pending upgrade {pending === 1 ? "request" : "requests"}.
          </span>
        ) : (
          "No pending upgrade requests."
        )}
      </p>

      <div className="mt-8">
        <AdminUsersTable users={users} />
      </div>
    </main>
  );
}
