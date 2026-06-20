"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink } from "@/components/dashboard/BackLink";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { updateProfile, type ProfileInput } from "@/lib/api-client";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(input: ProfileInput) {
    await updateProfile(input);
    setSuccess(true);
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <BackLink href="/dashboard" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Catalog settings
          </h1>
          <p className="text-gray-600">
            Edit your handle, catalog name, and contact details.
          </p>
        </div>
      </div>

      {success ? (
        <p className="mb-4 text-sm text-green-600">Settings saved.</p>
      ) : null}

      <ProfileForm
        initialValues={{
          handle: profile.handle,
          catalog_name: profile.catalog_name,
          phone: profile.phone ?? "",
          contact_email: profile.contact_email ?? "",
          address: profile.address ?? "",
        }}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </>
  );
}
