import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { BillingCard } from "@/components/billing/BillingCard";
import { getBillingState } from "@/lib/billing";
import { requireProfile, userHasPassword } from "@/lib/dal";

export const metadata = { title: "Settings | Cataloo" };

export default async function DashboardSettingsPage() {
  const profile = await requireProfile();
  const [hasPassword, billing] = await Promise.all([
    userHasPassword(profile.id),
    getBillingState(profile.id),
  ]);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <SettingsForm profile={profile} hasPassword={hasPassword} />
      <section id="billing" className="scroll-mt-20">
        <BillingCard
          plan={profile.plan}
          billing={billing}
          upgradeRequested={Boolean(profile.upgrade_requested_at)}
        />
      </section>
    </main>
  );
}
