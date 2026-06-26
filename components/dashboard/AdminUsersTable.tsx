"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setUserPlan } from "@/lib/api-client";
import type { AdminUserRow } from "@/lib/queries";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function change(user: AdminUserRow, plan: "free" | "pro") {
    setPendingId(user.id);
    try {
      await setUserPlan(user.id, plan);
      toast.success(`${user.handle} is now on ${plan === "pro" ? "Pro" : "Free"}.`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update plan.",
      );
    } finally {
      setPendingId(null);
    }
  }

  if (users.length === 0) {
    return <p className="text-sm text-gray-500">No users yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="p-3 font-medium">Catalog</th>
            <th className="p-3 font-medium">Email</th>
            <th className="p-3 font-medium">Plan</th>
            <th className="p-3 font-medium">Upgrade requested</th>
            <th className="p-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const pro = user.plan === "pro";
            const busy = pendingId === user.id;
            return (
              <tr
                key={user.id}
                className={`border-b border-gray-100 last:border-b-0 ${
                  user.upgrade_requested_at && !pro ? "bg-amber-50/50" : ""
                }`}
              >
                <td className="p-3">
                  <div className="font-medium text-gray-900">
                    {user.catalog_name}
                  </div>
                  <a
                    href={`/${user.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    cataloo.app/{user.handle}
                  </a>
                </td>
                <td className="p-3 text-gray-600">{user.email ?? "—"}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      pro
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {pro ? "Pro" : "Free"}
                  </span>
                </td>
                <td className="max-w-xs p-3 text-gray-600">
                  {user.upgrade_requested_at && !pro ? (
                    <div className="space-y-1">
                      <span className="font-medium text-amber-700">
                        {formatDate(user.upgrade_requested_at)}
                      </span>
                      {user.upgrade_request_message ? (
                        <p className="whitespace-pre-wrap text-xs italic text-gray-500">
                          “{user.upgrade_request_message}”
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-right">
                  {pro ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => change(user, "free")}
                    >
                      {busy ? "…" : "Downgrade"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => change(user, "pro")}
                    >
                      {busy ? "…" : "Activate Pro"}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
