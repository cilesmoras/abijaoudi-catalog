import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBillingDate, type BillingState } from "@/lib/billing";
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY } from "@/lib/plans";
import type { Plan } from "@/lib/types";

/** Settings → Billing: current plan, renewal/end date, and the next action. */
export function BillingCard({
  plan,
  billing,
  upgradeRequested,
}: {
  plan: Plan;
  billing: BillingState;
  upgradeRequested: boolean;
}) {
  const end = billing.currentPeriodEnd
    ? formatBillingDate(billing.currentPeriodEnd)
    : null;

  let summary: string;
  if (plan === "pro" && billing.source === "comp") {
    summary = "Pro — complimentary. No payment needed.";
  } else if (plan === "pro" && billing.source === "paddle") {
    const price =
      billing.interval === "year"
        ? `US$${PRO_PRICE_YEARLY}/year`
        : `US$${PRO_PRICE_MONTHLY}/month`;
    if (billing.status === "past_due") {
      summary = `Pro (${price}) — your last payment failed. Update your card to keep Pro.`;
    } else if (billing.cancelAtPeriodEnd) {
      summary = end
        ? `Pro (${price}) — canceled. You keep Pro until ${end}.`
        : `Pro (${price}) — canceled at the end of this period.`;
    } else {
      summary = end ? `Pro (${price}) — renews on ${end}.` : `Pro (${price}).`;
    }
  } else if (plan === "pro") {
    summary = "Pro — activated manually by Cataloo.";
  } else {
    summary = "Free plan.";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">{summary}</p>
        <div className="flex flex-wrap items-center gap-3">
          {billing.hasPaddleCustomer && billing.source !== "comp" ? (
            <ManageBillingButton
              label={
                billing.status === "past_due"
                  ? "Update payment method"
                  : "Manage billing"
              }
              variant={billing.status === "past_due" ? "default" : "outline"}
            />
          ) : null}
          {plan === "free" ? (
            <UpgradeButton
              alreadyRequested={upgradeRequested}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            />
          ) : null}
        </div>
        {billing.hasPaddleCustomer && billing.source !== "comp" ? (
          <p className="text-xs text-gray-500">
            Change your card, switch between monthly and yearly, cancel, or
            download invoices in the secure Paddle billing portal.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
