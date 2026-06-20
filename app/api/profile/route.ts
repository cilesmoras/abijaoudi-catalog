import { NextRequest } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getCurrentProfile, getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { mapProfileRow } from "@/lib/queries";

export const runtime = "nodejs";

type ProfileBody = {
  handle?: string;
  catalog_name?: string;
  phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
};

function cleanContact(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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
  const handle = normalizeHandle(body.handle ?? "");
  const catalogName = (body.catalog_name ?? "").trim();

  const handleError = validateHandle(handle);
  if (handleError) return Response.json({ error: handleError }, { status: 400 });
  if (!catalogName) {
    return Response.json({ error: "Catalog name is required" }, { status: 400 });
  }
  if (await handleTaken(handle)) {
    return Response.json({ error: "That handle is already taken" }, { status: 409 });
  }

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      handle,
      catalogName,
      phone: cleanContact(body.phone),
      contactEmail: cleanContact(body.contact_email),
      address: cleanContact(body.address),
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
  const handle = normalizeHandle(body.handle ?? "");

  const handleError = validateHandle(handle);
  if (handleError) return Response.json({ error: handleError }, { status: 400 });
  if (!catalogName) {
    return Response.json({ error: "Catalog name is required" }, { status: 400 });
  }
  if (handle !== profile.handle && (await handleTaken(handle, profile.id))) {
    return Response.json({ error: "That handle is already taken" }, { status: 409 });
  }

  const [updated] = await db
    .update(profiles)
    .set({
      handle,
      catalogName,
      phone: cleanContact(body.phone),
      contactEmail: cleanContact(body.contact_email),
      address: cleanContact(body.address),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id))
    .returning();

  return Response.json(mapProfileRow(updated));
}
