"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileInput } from "@/lib/api-client";

export type ProfileFormValues = {
  handle: string;
  catalog_name: string;
  phone: string;
  contact_email: string;
  address: string;
};

interface ProfileFormProps {
  initialValues?: Partial<ProfileFormValues>;
  submitLabel: string;
  onSubmit: (input: ProfileInput) => Promise<void>;
}

export function ProfileForm({
  initialValues,
  submitLabel,
  onSubmit,
}: ProfileFormProps) {
  const [handle, setHandle] = useState(initialValues?.handle ?? "");
  const [catalogName, setCatalogName] = useState(
    initialValues?.catalog_name ?? "",
  );
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(
    initialValues?.contact_email ?? "",
  );
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        handle: handle.trim().toLowerCase(),
        catalog_name: catalogName.trim(),
        phone: phone.trim() || null,
        contact_email: contactEmail.trim() || null,
        address: address.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="handle">Handle</Label>
        <div className="flex items-center rounded-md border bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
          <span className="select-none pl-3 text-sm text-gray-400">/</span>
          <Input
            id="handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value.toLowerCase())}
            placeholder="marias-bakery"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          Your public catalog link. 3–30 lowercase letters, numbers, hyphens.
        </p>
      </div>

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
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+1 555 123 4567"
        />
        <p className="text-xs text-gray-500">
          Used for the &quot;Order on WhatsApp&quot; button on your catalog.
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
