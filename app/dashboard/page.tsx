import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await requireProfile();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {profile.catalog_name}
          </h1>
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
