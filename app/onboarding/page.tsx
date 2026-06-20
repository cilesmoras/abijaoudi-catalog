import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/dal";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  // Prefill the catalog name from the Google display name if available.
  const suggestedName =
    (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">
          Set up your catalog
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Choose a handle and add your contact details. You can change these
          later.
        </p>
        <OnboardingForm suggestedName={suggestedName} />
      </div>
    </main>
  );
}
