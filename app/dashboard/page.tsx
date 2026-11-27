import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { UpgradeSuccessNotice } from "@/components/billing/UpgradeSuccessNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBillingDate, getBillingState } from "@/lib/billing";
import { requireProfile } from "@/lib/dal";
import { FREE_ITEM_LIMIT, isPro, proDaysRemaining } from "@/lib/plans";
import { withRLS } from "@/lib/db/rls";
import { countItemsForOwner } from "@/lib/queries";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Dashboard | Cataloo" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const [profile, { upgraded }] = await Promise.all([
    requireProfile(),
    searchParams,
  ]);
  const [itemCount, billing] = await Promise.all([
    withRLS(profile.id, (tx) => countItemsForOwner(profile.id, tx)),
    getBillingState(profile.id),
  ]);
  const pro = isPro(profile.plan);
  const atLimit = !pro && itemCount >= FREE_ITEM_LIMIT;
  const upgradeRequested = Boolean(profile.upgrade_requested_at);
  const daysLeft = proDaysRemaining(profile.plan, profile.pro_expires_at);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      {upgraded === "1" ? <UpgradeSuccessNotice isPro={pro} /> : null}
      {pro && billing.source === "paddle" && billing.status === "past_due" ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Your last payment failed. We&apos;ll retry it, but please{" "}
          <Link
            href="/dashboard/settings#billing"
            className="font-medium underline"
          >
            update your payment method
          </Link>{" "}
          to keep Pro.
        </div>
      ) : pro &&
        billing.source === "paddle" &&
        billing.cancelAtPeriodEnd &&
        billing.currentPeriodEnd ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your Pro plan is canceled and ends on{" "}
          {formatBillingDate(billing.currentPeriodEnd)}.{" "}
          <Link
            href="/dashboard/settings#billing"
            className="font-medium underline"
          >
            Manage billing
          </Link>{" "}
          to keep it.
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {profile.catalog_name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                pro ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {pro ? "Pro plan" : "Free plan"}
            </span>
          </div>
          {daysLeft !== null ? (
            <p
              className={`mt-1 text-sm font-medium ${
                daysLeft <= 0
                  ? "text-red-600"
                  : daysLeft <= 7
                    ? "text-amber-600"
                    : "text-gray-500"
              }`}
            >
              {daysLeft <= 0
                ? "Pro expired — contact us to renew"
                : `Pro expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
            </p>
          ) : null}
          <Link
            href={`/${profile.handle}`}
            target="_blank"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            View public catalog
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <span>Share link: cataloo.app/{profile.handle}</span>
            <CopyLinkButton value={`https://cataloo.app/${profile.handle}`} />
          </div>
          {!pro ? (
            <p className="mt-1 inline-flex flex-wrap items-center gap-1 text-sm text-gray-500">
              <UpgradeButton
                alreadyRequested={upgradeRequested}
                className="font-medium text-blue-600 hover:underline disabled:opacity-60"
                requestedClassName="font-medium text-emerald-600"
              />{" "}
              for unlimited items, multiple photos, and analytics.
            </p>
          ) : null}
        </div>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create, update, and delete products in your catalog.
            </p>
            <p className="text-sm font-medium text-gray-700">
              {pro
                ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
                : `${itemCount} of ${FREE_ITEM_LIMIT} items used`}
            </p>
            {atLimit ? (
              <p className="inline-flex flex-wrap items-center gap-1 text-sm text-amber-600">
                You&apos;ve reached the Free plan limit.{" "}
                <UpgradeButton
                  alreadyRequested={upgradeRequested}
                  className="font-medium text-amber-700 underline disabled:opacity-60"
                  requestedClassName="font-medium text-emerald-600"
                />{" "}
                for unlimited items.
              </p>
            ) : null}
            <Button asChild>
              <Link href="/dashboard/items">Manage items</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Organize products into categories for storefront filtering.
            </p>
            <Button asChild>
              <Link href="/dashboard/categories">Manage categories</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalog settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Edit your handle, catalog name, and contact details.
            </p>
            <Button asChild>
              <Link href="/dashboard/settings">Edit settings</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
