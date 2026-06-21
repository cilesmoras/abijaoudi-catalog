"use client";

import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createProfile, type ProfileInput } from "@/lib/api-client";

export function OnboardingForm({ suggestedName }: { suggestedName: string }) {
  const router = useRouter();

  async function handleSubmit(input: ProfileInput) {
    await createProfile(input);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <ProfileForm
      initialValues={{ catalog_name: suggestedName }}
      submitLabel="Create catalog"
      onSubmit={handleSubmit}
      hideHandle
    />
  );
}
