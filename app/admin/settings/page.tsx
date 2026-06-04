"use client";

import {
  getSettingsAction,
  updateSettingsAction,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError(null);

      try {
        const payload = await getSettingsAction();
        setStoreName(payload.store_name);
      } catch {
        setLoading(false);
        setError("Failed to load settings");
        return;
      }
      setLoading(false);
    }

    void loadSettings();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = storeName.trim();
    if (!trimmedName) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const payload = await updateSettingsAction(trimmedName);
    if (payload.error || !payload.data) {
      setSubmitting(false);
      setError(payload?.error ?? "Failed to save settings");
      return;
    }

    setStoreName(payload.data.store_name);
    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Store settings
          </h1>
          <p className="text-gray-600">
            Set the name shown on the catalog and exported PDF.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading settings…</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="store-name"
              className="block text-sm font-medium text-gray-700"
            >
              Store name
            </label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(event) => {
                setStoreName(event.target.value);
                setSuccess(false);
              }}
              placeholder="Store name"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? (
            <p className="text-sm text-green-600">Store name saved.</p>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </main>
  );
}
