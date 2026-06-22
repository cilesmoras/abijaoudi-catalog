"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { updateProfile, type ProfileInput } from "@/lib/api-client";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleSubmit(input: ProfileInput) {
    await updateProfile(input);
    toast.success("Settings saved.");
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Catalog settings
          </h1>
          <p className="text-gray-600">
            Edit your handle, catalog name, and contact details.
          </p>
        </div>
      </div>

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
          logo_url: profile.logo_url ?? "",
        }}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        plan={profile.plan}
      />
    </>
  );
}
