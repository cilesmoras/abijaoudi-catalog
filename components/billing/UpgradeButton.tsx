"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RequestUpgradeButton } from "@/components/dashboard/RequestUpgradeButton";
import {
  paddleCheckoutEnabled,
  usePaddleCheckout,
} from "@/components/billing/PaddleCheckoutProvider";
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY } from "@/lib/plans";
import { cn } from "@/lib/utils";

type BillingPeriod = "month" | "year";

const PRICE_IDS: Record<BillingPeriod, string | undefined> = {
  month: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
  year: process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY,
};

// Shown until Paddle returns the visitor's localized price.
const FALLBACK: Record<BillingPeriod, string> = {
  month: `US$${PRO_PRICE_MONTHLY}`,
  year: `US$${PRO_PRICE_YEARLY}`,
};

type Props = {
  alreadyRequested?: boolean;
  className?: string;
  requestedClassName?: string;
  label?: string;
};

/**
 * "Upgrade to Pro" entry point. Opens a plan picker, then Paddle's overlay
 * checkout with the owner's id in customData (the webhook uses it to find
 * the profile). Falls back to the manual request flow when Paddle isn't
 * configured for this deployment.
 */
export function UpgradeButton(props: Props) {
  if (!paddleCheckoutEnabled || !PRICE_IDS.month || !PRICE_IDS.year) {
    return <RequestUpgradeButton {...props} />;
  }
  return <PaddleUpgradeButton {...props} />;
}

function PaddleUpgradeButton({ className, label = "Upgrade to Pro" }: Props) {
  const { ownerId, email, loadPaddle } = usePaddleCheckout();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>("year");
  const [prices, setPrices] = useState<Record<BillingPeriod, string>>(FALLBACK);
  const [opening, setOpening] = useState(false);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    try {
      const paddle = await loadPaddle();
      // Paddle localizes by the visitor's IP. Show pre-tax unit prices; tax is
      // added in checkout where it applies.
      const preview = await paddle.PricePreview({
        items: [
          { priceId: PRICE_IDS.month!, quantity: 1 },
          { priceId: PRICE_IDS.year!, quantity: 1 },
        ],
      });
      const localized: Record<BillingPeriod, string> = { ...FALLBACK };
      for (const line of preview.data.details.lineItems) {
        if (line.price.id === PRICE_IDS.month) {
          localized.month = line.formattedTotals.subtotal;
        }
        if (line.price.id === PRICE_IDS.year) {
          localized.year = line.formattedTotals.subtotal;
        }
      }
      setPrices(localized);
    } catch {
      // Keep USD fallback prices; checkout still localizes.
    }
  }

  async function startCheckout() {
    setOpening(true);
    try {
      const paddle = await loadPaddle();
      setOpen(false);
      paddle.Checkout.open({
        items: [{ priceId: PRICE_IDS[period]!, quantity: 1 }],
        ...(email ? { customer: { email } } : {}),
        customData: { ownerId },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          theme: "light",
          successUrl: `${window.location.origin}/dashboard?upgraded=1`,
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not open checkout.",
      );
    } finally {
      setOpening(false);
    }
  }

  const options: { id: BillingPeriod; title: string; note: string }[] = [
    {
      id: "year",
      title: "Yearly",
      note: `${prices.year} / year · 2 months free`,
    },
    { id: "month", title: "Monthly", note: `${prices.month} / month` },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "w-fit text-xs font-medium text-blue-600 hover:underline disabled:opacity-60"
          }
        >
          {label}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Cataloo Pro</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Unlimited items, multiple full-quality photos, your own link, no
            Cataloo badge, and analytics. Cancel anytime.
          </p>
        </DialogHeader>

        <div
          role="radiogroup"
          aria-label="Billing period"
          className="space-y-2"
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={period === option.id}
              onClick={() => setPeriod(option.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors",
                period === option.id
                  ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <span className="font-medium text-gray-900">{option.title}</span>
              <span className="text-sm text-gray-600">{option.note}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Renews automatically until canceled. Taxes may apply. Payments are
          processed by Paddle.com, our Merchant of Record. 14-day refund — see
          our{" "}
          <a href="/refund" target="_blank" className="underline">
            refund policy
          </a>
          .
        </p>

        <div className="flex justify-end">
          <Button onClick={startCheckout} disabled={opening}>
            {opening ? "Opening checkout…" : "Continue to payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
