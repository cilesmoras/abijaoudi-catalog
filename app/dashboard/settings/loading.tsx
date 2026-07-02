import { SettingsSkeleton } from "@/components/dashboard/SettingsSkeleton";

export default function SettingsLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <SettingsSkeleton />
    </main>
  );
}
