"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { CurrencyCombobox } from "@/components/ui/currency-combobox";
import { detectCountryCode } from "@/lib/countries";
import type { ProfileInput } from "@/lib/api-client";
import type { Plan } from "@/lib/types";
import { canUseCustomHandle, isPro } from "@/lib/plans";

export type ProfileFormValues = {
  handle: string;
  catalog_name: string;
  phone: string;
  country: string;
  contact_email: string;
  address: string;
  currency: string;
  offers_delivery: boolean;
  offers_pickup: boolean;
  delivery_payment_upfront: boolean;
  delivery_payment_cod: boolean;
  delivery_fee: string;
  logo_url: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
};

interface ProfileFormProps {
  initialValues?: Partial<ProfileFormValues>;
  submitLabel: string;
  onSubmit: (input: ProfileInput) => Promise<void>;
  /** Drives handle/logo gating. Defaults to "free". */
  plan?: Plan;
  /** Onboarding hides the handle entirely (it's auto-assigned server-side). */
  hideHandle?: boolean;
}

export function ProfileForm({
  initialValues,
  submitLabel,
  onSubmit,
  plan = "free",
  hideHandle = false,
}: ProfileFormProps) {
  const [handle, setHandle] = useState(initialValues?.handle ?? "");
  const [logoUrl, setLogoUrl] = useState(initialValues?.logo_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const customHandleAllowed = canUseCustomHandle(plan);
  const [catalogName, setCatalogName] = useState(
    initialValues?.catalog_name ?? "",
  );
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [country, setCountry] = useState(initialValues?.country ?? "");
  const [contactEmail, setContactEmail] = useState(
    initialValues?.contact_email ?? "",
  );
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [currency, setCurrency] = useState(initialValues?.currency ?? "");
  const [offersDelivery, setOffersDelivery] = useState(
    initialValues?.offers_delivery ?? false,
  );
  const [offersPickup, setOffersPickup] = useState(
    initialValues?.offers_pickup ?? false,
  );
  const [paymentUpfront, setPaymentUpfront] = useState(
    initialValues?.delivery_payment_upfront ?? false,
  );
  const [paymentCod, setPaymentCod] = useState(
    initialValues?.delivery_payment_cod ?? false,
  );
  const [deliveryFee, setDeliveryFee] = useState(
    initialValues?.delivery_fee ?? "",
  );
  const [facebookUrl, setFacebookUrl] = useState(
    initialValues?.facebook_url ?? "",
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialValues?.instagram_url ?? "",
  );
  const [tiktokUrl, setTiktokUrl] = useState(initialValues?.tiktok_url ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-select the owner's country from the browser when none is set yet (new
  // catalogs). Deliberately runs after mount, not during render: the server has
  // no `navigator`, so detecting during render would cause a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!country) setCountry(detectCountryCode());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        handle: handle.trim().toLowerCase(),
        catalog_name: catalogName.trim(),
        phone: phone.trim() || null,
        country: phone.trim() ? country || null : null,
        contact_email: contactEmail.trim() || null,
        address: address.trim() || null,
        currency: currency || null,
        offers_delivery: offersDelivery,
        offers_pickup: offersPickup,
        delivery_payment_upfront: offersDelivery ? paymentUpfront : false,
        delivery_payment_cod: offersDelivery ? paymentCod : false,
        delivery_fee:
          offersDelivery && deliveryFee.trim()
            ? Number(deliveryFee)
            : null,
        logo_url: logoUrl.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        tiktok_url: tiktokUrl.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Logo upload failed");
      }
      const payload = (await response.json()) as { url: string };
      setLogoUrl(payload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {hideHandle ? null : (
        <div className="space-y-2">
          <Label htmlFor="handle">Handle</Label>
          <div
            className={`flex items-center rounded-md border ${
              customHandleAllowed
                ? "bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500"
                : "bg-gray-100"
            }`}
          >
            <span className="select-none pl-3 text-sm text-gray-400">/</span>
            <Input
              id="handle"
              value={handle}
              onChange={(event) => setHandle(event.target.value.toLowerCase())}
              placeholder="marias-bakery"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 disabled:opacity-100"
              disabled={!customHandleAllowed}
              required={customHandleAllowed}
            />
          </div>
          {customHandleAllowed ? (
            <p className="text-xs text-gray-500">
              Your public catalog link. 3–30 lowercase letters, numbers, hyphens.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              A custom link is a{" "}
              <span className="font-medium text-blue-600">Pro</span> feature.
              Your Free catalog keeps this auto-generated link.
            </p>
          )}
        </div>
      )}

      {isPro(plan) ? (
        <div className="space-y-2">
          <Label htmlFor="logo">Logo (for PDF export)</Label>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Catalog logo"
              className="h-12 w-12 rounded border bg-white object-contain p-1"
            />
          ) : null}
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            disabled={uploadingLogo}
          />
          <p className="text-xs text-gray-500">
            {uploadingLogo
              ? "Uploading…"
              : "Shown on your exported PDF in place of the Cataloo branding."}
          </p>
        </div>
      ) : null}

      {isPro(plan) ? (
        <div className="space-y-3 rounded-md border p-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Social media</p>
            <p className="text-xs text-gray-500">
              Linked from your public catalog and shown on PDF exports.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_url">Facebook</Label>
            <Input
              id="facebook_url"
              type="url"
              inputMode="url"
              value={facebookUrl}
              onChange={(event) => setFacebookUrl(event.target.value)}
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram_url">Instagram</Label>
            <Input
              id="instagram_url"
              type="url"
              inputMode="url"
              value={instagramUrl}
              onChange={(event) => setInstagramUrl(event.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktok_url">TikTok</Label>
            <Input
              id="tiktok_url"
              type="url"
              inputMode="url"
              value={tiktokUrl}
              onChange={(event) => setTiktokUrl(event.target.value)}
              placeholder="https://tiktok.com/@yourhandle"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="catalog_name">Catalog name</Label>
        <Input
          id="catalog_name"
          value={catalogName}
          onChange={(event) => setCatalogName(event.target.value)}
          placeholder="Maria's Bakery"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone / WhatsApp</Label>
        <div className="flex gap-2">
          <CountryCombobox
            value={country}
            onChange={setCountry}
            className="w-[7.5rem] shrink-0"
          />
          <Input
            id="phone"
            type="tel"
            className="flex-1"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="917 123 4567"
          />
        </div>
        <p className="text-xs text-gray-500">
          Used for the &quot;Order on WhatsApp&quot; button on your catalog. Pick
          your country, then enter your local number without the country code.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_email">Contact email</Label>
        <Input
          id="contact_email"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          placeholder="hello@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="123 Main St, Springfield"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <CurrencyCombobox
          id="currency"
          value={currency}
          onChange={setCurrency}
        />
        <p className="text-xs text-gray-500">
          Shown with every price on your catalog. Leave unset to show plain
          numbers.
        </p>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Delivery & pickup</p>
          <p className="text-xs text-gray-500">
            Shown to customers on your catalog so they know how you fulfill
            orders.
          </p>
        </div>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={offersDelivery}
            onChange={(event) => setOffersDelivery(event.target.checked)}
          />
          <span className="text-sm text-gray-700">Offers delivery</span>
        </label>

        {offersDelivery ? (
          <div className="space-y-3 border-l-2 border-gray-100 pl-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">
                Payment accepted for deliveries
              </p>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={paymentUpfront}
                  onChange={(event) => setPaymentUpfront(event.target.checked)}
                />
                <span className="text-sm text-gray-700">Upfront payment</span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={paymentCod}
                  onChange={(event) => setPaymentCod(event.target.checked)}
                />
                <span className="text-sm text-gray-700">Cash on delivery</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Delivery fee</Label>
              <Input
                id="delivery_fee"
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={(event) => setDeliveryFee(event.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">
                Leave blank for free delivery.
              </p>
            </div>
          </div>
        ) : null}

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={offersPickup}
            onChange={(event) => setOffersPickup(event.target.checked)}
          />
          <span className="text-sm text-gray-700">Offers pickup</span>
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
