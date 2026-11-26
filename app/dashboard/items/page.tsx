import { Suspense } from "react";
import { ItemsManager } from "@/components/dashboard/ItemsManager";
import { ItemsSkeleton } from "@/components/dashboard/ItemsSkeleton";
import { requireProfile } from "@/lib/dal";
import { withRLS } from "@/lib/db/rls";
import { getCategoriesForOwner, getItemsForOwner } from "@/lib/queries";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Items | Cataloo" };

export default async function DashboardItemsPage() {
  const profile = await requireProfile();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <Suspense fallback={<ItemsSkeleton />}>
        <ItemsData profile={profile} />
      </Suspense>
    </main>
  );
}

async function ItemsData({ profile }: { profile: Profile }) {
  const [items, categories] = await Promise.all([
    withRLS(profile.id, (tx) => getItemsForOwner(profile.id, tx)),
    withRLS(profile.id, (tx) => getCategoriesForOwner(profile.id, tx)),
  ]);

  return (
    <ItemsManager
      initialItems={items}
      initialCategories={categories}
      catalogName={profile.catalog_name}
      currency={profile.currency}
      plan={profile.plan}
      logoUrl={profile.logo_url}
      phone={profile.phone}
      country={profile.country}
      contactEmail={profile.contact_email}
      address={profile.address}
      socials={{
        facebook: profile.facebook_url,
        instagram: profile.instagram_url,
        tiktok: profile.tiktok_url,
      }}
      upgradeRequested={Boolean(profile.upgrade_requested_at)}
    />
  );
}
