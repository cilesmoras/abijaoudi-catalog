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
          country: profile.country ?? "",
          contact_email: profile.contact_email ?? "",
          address: profile.address ?? "",
          currency: profile.currency ?? "",
          offers_delivery: profile.offers_delivery,
          offers_pickup: profile.offers_pickup,
          delivery_payment_upfront: profile.delivery_payment_upfront,
          delivery_payment_cod: profile.delivery_payment_cod,
          delivery_fee:
            profile.delivery_fee != null ? String(profile.delivery_fee) : "",
        }}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </>
  );
}
