import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { requireProfile } from "@/lib/dal";

export const metadata = { title: "Settings | Cataloo" };

export default async function DashboardSettingsPage() {
  const profile = await requireProfile();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <SettingsForm profile={profile} />
    </main>
  );
}
