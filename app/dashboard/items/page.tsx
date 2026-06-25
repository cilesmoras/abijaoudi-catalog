import { requireProfile } from "@/lib/dal";
import { ItemsManager } from "@/components/dashboard/ItemsManager";

export default async function DashboardItemsPage() {
  const profile = await requireProfile();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <ItemsManager
        catalogName={profile.catalog_name}
        currency={profile.currency}
        plan={profile.plan}
        logoUrl={profile.logo_url}
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
