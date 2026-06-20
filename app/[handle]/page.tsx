import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard, Mail, MapPin, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { isReservedHandle, normalizeHandle } from "@/lib/handles";
import {
  getCategoriesForOwner,
  getVisibleItemsForOwner,
  getProfileByHandle,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { PublicCatalog } from "@/components/catalog/PublicCatalog";

async function loadCatalog(rawHandle: string) {
  const handle = normalizeHandle(rawHandle);
  if (isReservedHandle(handle)) return null;
  const profile = await getProfileByHandle(handle);
  if (!profile) return null;
  const [items, categories] = await Promise.all([
    getVisibleItemsForOwner(profile.id),
    getCategoriesForOwner(profile.id),
  ]);
  return { profile, items, categories };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const data = await loadCatalog(handle);
  if (!data) return { title: "Catalog not found" };
  return {
    title: data.profile.catalog_name,
    description: `Browse the ${data.profile.catalog_name} catalog.`,
  };
}

export default async function PublicCatalogPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await loadCatalog(handle);
  if (!data) notFound();

  const { profile, items, categories } = data;

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === profile.id;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:px-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {profile.catalog_name}
          </h1>
          {isOwner ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          {profile.phone ? (
            <a
              href={`tel:${profile.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 hover:text-gray-900"
            >
              <Phone className="h-4 w-4" />
              {profile.phone}
            </a>
          ) : null}
          {profile.contact_email ? (
            <a
              href={`mailto:${profile.contact_email}`}
              className="inline-flex items-center gap-1.5 hover:text-gray-900"
            >
              <Mail className="h-4 w-4" />
              {profile.contact_email}
            </a>
          ) : null}
          {profile.address ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {profile.address}
            </span>
          ) : null}
        </div>
      </header>

      <PublicCatalog profile={profile} items={items} categories={categories} />
    </main>
  );
}
