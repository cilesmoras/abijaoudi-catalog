import { requireProfile } from "@/lib/dal";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default async function DashboardSettingsPage() {
  const profile = await requireProfile();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <SettingsForm profile={profile} />
    </main>
  );
}
