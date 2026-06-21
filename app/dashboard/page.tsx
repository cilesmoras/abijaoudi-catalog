import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { countItemsForOwner } from "@/lib/queries";
import { FREE_ITEM_LIMIT, isPro } from "@/lib/plans";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const itemCount = await countItemsForOwner(profile.id);
  const pro = isPro(profile.plan);
  const atLimit = !pro && itemCount >= FREE_ITEM_LIMIT;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {profile.catalog_name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                pro
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {pro ? "Pro plan" : "Free plan"}
            </span>
          </div>
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
          <p className="mt-1 text-sm text-gray-500">
            {pro ? (
              "Catalogs: unlimited"
            ) : (
              <>
                Catalogs: 1 of 1 ·{" "}
                <Link href="/#pricing" className="font-medium text-blue-600 hover:underline">
                  Upgrade to Pro
                </Link>{" "}
                for unlimited
              </>
            )}
          </p>
        </div>
        <LogoutButton />
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
              <p className="text-sm text-amber-600">
                You&apos;ve reached the Free plan limit.{" "}
                <Link href="/#pricing" className="font-medium underline">
                  Upgrade to Pro
                </Link>{" "}
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
