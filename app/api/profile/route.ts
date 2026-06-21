import { NextRequest } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getCurrentProfile, getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import {
  generateRandomHandle,
  isReservedHandle,
  normalizeHandle,
  validateHandle,
} from "@/lib/handles";
import { isValidCountryCode } from "@/lib/countries";
import { isValidCurrencyCode } from "@/lib/currencies";
import { mapProfileRow } from "@/lib/queries";
import { canUseCustomHandle, isPro } from "@/lib/plans";

export const runtime = "nodejs";

type ProfileBody = {
  handle?: string;
  catalog_name?: string;
  phone?: string | null;
  country?: string | null;
  contact_email?: string | null;
  address?: string | null;
  currency?: string | null;
  offers_delivery?: boolean;
  offers_pickup?: boolean;
  delivery_payment_upfront?: boolean;
  delivery_payment_cod?: boolean;
  delivery_fee?: number | string | null;
  logo_url?: string | null;
};

function cleanContact(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function cleanCountry(value: unknown): string | null {
  return isValidCountryCode(value) ? (value as string).toUpperCase() : null;
}

function cleanCurrency(value: unknown): string | null {
  return isValidCurrencyCode(value) ? value.toUpperCase() : null;
}

// A flat delivery fee is optional; treat blank / non-positive / invalid values
// as null so the catalog can show "Free delivery".
function cleanDeliveryFee(value: unknown): number | null {
  const fee = typeof value === "string" ? Number(value) : value;
  if (typeof fee !== "number" || !Number.isFinite(fee) || fee <= 0) return null;
  return fee;
}

// Fulfillment settings, normalized so dependent fields are only stored when the
// owner actually offers delivery (no stale payment methods / fee otherwise).
function fulfillmentFields(body: ProfileBody) {
  const offersDelivery = Boolean(body.offers_delivery);
  return {
    offersDelivery,
    offersPickup: Boolean(body.offers_pickup),
    deliveryPaymentUpfront: offersDelivery
      ? Boolean(body.delivery_payment_upfront)
      : false,
    deliveryPaymentCod: offersDelivery
      ? Boolean(body.delivery_payment_cod)
      : false,
    deliveryFee: offersDelivery ? cleanDeliveryFee(body.delivery_fee) : null,
  };
}

// A phone number is only useful for WhatsApp / `tel:` links if we know which
// country it belongs to. Require a valid country whenever a phone is given.
function contactError(body: ProfileBody): string | null {
  if (cleanContact(body.phone) && !cleanCountry(body.country)) {
    return "Select a country for your phone number";
  }
  return null;
}

async function handleTaken(handle: string, exceptId?: string): Promise<boolean> {
  const condition = exceptId
    ? and(eq(profiles.handle, handle), ne(profiles.id, exceptId))
    : eq(profiles.handle, handle);
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(condition)
    .limit(1);
  return Boolean(row);
}

// New Free catalogs get an auto-assigned random handle (custom handles are a
// Pro feature). Retry on the rare collision / reserved-word clash.
async function uniqueRandomHandle(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateRandomHandle();
    if (!isReservedHandle(candidate) && !(await handleTaken(candidate))) {
      return candidate;
    }
  }
  // Astronomically unlikely to get here; widen the space and try once more.
  return generateRandomHandle(8);
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(profile);
}

// Create the profile during onboarding.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getCurrentProfile();
  if (existing) {
    return Response.json({ error: "Profile already exists" }, { status: 409 });
  }

  const body = (await request.json()) as ProfileBody;
  const catalogName = (body.catalog_name ?? "").trim();

  if (!catalogName) {
    return Response.json({ error: "Catalog name is required" }, { status: 400 });
  }
  const contactErr = contactError(body);
  if (contactErr) return Response.json({ error: contactErr }, { status: 400 });

  // New catalogs start on the Free plan, so the handle is always auto-assigned;
  // any client-supplied handle is ignored. Custom handles are a Pro feature.
  const handle = await uniqueRandomHandle();

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      handle,
      catalogName,
      phone: cleanContact(body.phone),
      country: cleanCountry(body.country),
      contactEmail: cleanContact(body.contact_email),
      address: cleanContact(body.address),
      currency: cleanCurrency(body.currency),
      ...fulfillmentFields(body),
    })
    .returning();

  return Response.json(mapProfileRow(created), { status: 201 });
}

// Update catalog name, contact info, and handle from settings.
export async function PUT(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ProfileBody;
  const catalogName = (body.catalog_name ?? "").trim();

  if (!catalogName) {
    return Response.json({ error: "Catalog name is required" }, { status: 400 });
  }
  const contactErr = contactError(body);
  if (contactErr) return Response.json({ error: contactErr }, { status: 400 });

  // Only Pro can change the handle (custom links) and set a PDF logo. Free
  // users keep their existing handle/logo no matter what the client sends.
  let handle = profile.handle;
  if (canUseCustomHandle(profile.plan)) {
    const submitted = normalizeHandle(body.handle ?? "");
    const handleError = validateHandle(submitted);
    if (handleError)
      return Response.json({ error: handleError }, { status: 400 });
    if (submitted !== profile.handle && (await handleTaken(submitted, profile.id))) {
      return Response.json(
        { error: "That handle is already taken" },
        { status: 409 },
      );
    }
    handle = submitted;
  }
  const logoUrl = isPro(profile.plan)
    ? cleanContact(body.logo_url)
    : profile.logo_url;

  const [updated] = await db
    .update(profiles)
    .set({
      handle,
      catalogName,
      logoUrl,
      phone: cleanContact(body.phone),
      country: cleanCountry(body.country),
      contactEmail: cleanContact(body.contact_email),
      address: cleanContact(body.address),
      currency: cleanCurrency(body.currency),
      ...fulfillmentFields(body),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id))
    .returning();

  return Response.json(mapProfileRow(updated));
}
