import { requireProfile } from "@/lib/dal";
import { ItemsManager } from "@/components/dashboard/ItemsManager";

export default async function DashboardItemsPage() {
  const profile = await requireProfile();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <ItemsManager catalogName={profile.catalog_name} />
    </main>
  );
}
