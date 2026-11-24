"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileInput } from "@/lib/api-client";
import type { Profile } from "@/lib/types";

export function SettingsForm({
  profile,
  hasPassword,
}: {
  profile: Profile;
  hasPassword: boolean;
}) {
  const router = useRouter();

  async function handleSubmit(input: ProfileInput) {
    await updateProfile(input);
    toast.success("Settings saved.");
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Catalog settings
          </h1>
          <p className="text-gray-600">
            Edit your handle, catalog name, and contact details.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings/password">
            <KeyRound />
            {hasPassword ? "Change password" : "Set a password"}
          </Link>
        </Button>
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
          facebook_url: profile.facebook_url ?? "",
          instagram_url: profile.instagram_url ?? "",
          tiktok_url: profile.tiktok_url ?? "",
        }}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        plan={profile.plan}
      />
    </>
  );
}
