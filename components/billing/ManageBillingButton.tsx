"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBillingPortalSession } from "@/app/dashboard/settings/billing-actions";

/** Opens Paddle's hosted customer portal (card, cancel, plan, invoices). */
export function ManageBillingButton({
  label = "Manage billing",
  variant = "outline",
}: {
  label?: string;
  variant?: "outline" | "default";
}) {
  const [pending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <Button type="button" variant={variant} onClick={open} disabled={pending}>
      {pending ? "Opening…" : label}
    </Button>
  );
}
