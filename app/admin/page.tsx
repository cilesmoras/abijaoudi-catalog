import { LogoutButton } from "@/components/admin/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Catalog Admin
          </h1>
          <p className="mt-2 text-gray-600">
            Manage products and categories for the public catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/">Back to catalog</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create, update, and delete products that appear in your catalog.
            </p>
            <Button asChild>
              <Link href="/admin/items">Manage items</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Organize products into categories used by storefront filtering.
            </p>
            <Button asChild>
              <Link href="/admin/categories">Manage categories</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
