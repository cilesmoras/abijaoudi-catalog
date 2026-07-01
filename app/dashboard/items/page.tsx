import { ItemsManager } from "@/components/dashboard/ItemsManager";
import { requireProfile } from "@/lib/dal";

export const metadata = { title: "Items | Cataloo" };

export default async function DashboardItemsPage() {
  const profile = await requireProfile();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <ItemsManager
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
    </main>
  );
}
