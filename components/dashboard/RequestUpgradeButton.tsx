"use client";

import { useState } from "react";
import { toast } from "sonner";
import { requestUpgrade } from "@/lib/api-client";

/**
 * Lets a Free user ask to upgrade. There's no payment provider yet, so this
 * flags the profile for the admin users page and we follow up out-of-band.
 * Reusable across the sidebar, dashboard, and items pages via `className`.
 */
export function RequestUpgradeButton({
  alreadyRequested = false,
  className,
  requestedClassName,
  label = "Upgrade to Pro",
}: {
  alreadyRequested?: boolean;
  className?: string;
  requestedClassName?: string;
  label?: string;
}) {
  const [requested, setRequested] = useState(alreadyRequested);
  const [loading, setLoading] = useState(false);

  if (requested) {
    return (
      <span
        className={
          requestedClassName ?? "text-xs font-medium text-emerald-600"
        }
      >
        Upgrade requested — we&apos;ll be in touch ✓
      </span>
    );
  }

  async function handleClick() {
    setLoading(true);
    try {
      await requestUpgrade();
      setRequested(true);
      toast.success("Request received — we'll contact you to activate Pro.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "w-fit text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
      }
    >
      {loading ? "Sending…" : label}
    </button>
  );
}
