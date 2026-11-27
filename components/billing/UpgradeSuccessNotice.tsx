"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const POLL_MS = 2000;
const MAX_POLLS = 20; // ~40s

/**
 * Shown after Paddle redirects to /dashboard?upgraded=1. The webhook that
 * flips the plan usually lands within seconds, so refresh the server data
 * until Pro shows up, then drop the query param.
 */
export function UpgradeSuccessNotice({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const polls = useRef(0);
  const done = useRef(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isPro) {
      if (done.current) return;
      done.current = true;
      toast.success("Welcome to Cataloo Pro!");
      router.replace(pathname);
      return;
    }
    const id = setTimeout(() => {
      if (polls.current >= MAX_POLLS) {
        setTimedOut(true);
        return;
      }
      polls.current += 1;
      router.refresh();
    }, POLL_MS);
    return () => clearTimeout(id);
  });

  if (isPro) return null;
  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
    >
      {timedOut
        ? "Payment received — Pro is taking longer than usual to activate. Refresh in a minute, or email support@cataloo.app if it doesn't appear."
        : "Payment received — activating Pro…"}
    </div>
  );
}
