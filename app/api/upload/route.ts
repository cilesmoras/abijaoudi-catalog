import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { getCurrentProfile } from "@/lib/dal";

export const runtime = "nodejs";

// Longest-edge sizes (px). Catalog image is kept small to keep PDF exports light.
const CATALOG_MAX = 200; // catalog page + embedded in the exported PDF
const THUMB_MAX = 80; // displayed ~40px in the admin items table

const bucketName = "item-images";

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Use service role key on the server so storage RLS is bypassed.
  // Fall back to anon key if service role key is not configured.
  const supabase = createClient(supabaseUrl, serviceRoleKey ?? anonKey, {
    auth: { persistSession: false },
  });
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // Resize into two JPEG variants. `.rotate()` (no args) bakes in EXIF
  // orientation so downstream consumers (catalog + PDF) never need to.
  let catalogBuffer: Buffer;
  let thumbBuffer: Buffer;
  try {
    catalogBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: CATALOG_MAX,
        height: CATALOG_MAX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    thumbBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: THUMB_MAX,
        height: THUMB_MAX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch {
    return Response.json(
      { error: "Could not process image. Please upload a valid image file." },
      { status: 400 },
    );
  }

  async function uploadJpeg(filename: string, body: Buffer) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, body, { contentType: "image/jpeg", upsert: false });

    if (error) {
      const message = error.message.toLowerCase().includes("bucket")
        ? `Storage bucket "${bucketName}" not found. Create it in Supabase Storage.`
        : error.message;
      return { error: message } as const;
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl } as const;
  }

  // Namespace uploads per owner so tenants are isolated within the bucket.
  const base = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const catalogUpload = await uploadJpeg(`${base}-cat.jpg`, catalogBuffer);
  if ("error" in catalogUpload) {
    return Response.json({ error: catalogUpload.error }, { status: 500 });
  }

  const thumbUpload = await uploadJpeg(`${base}-thumb.jpg`, thumbBuffer);
  if ("error" in thumbUpload) {
    return Response.json({ error: thumbUpload.error }, { status: 500 });
  }

  return Response.json(
    { url: catalogUpload.url, thumbnailUrl: thumbUpload.url },
    { status: 201 },
  );
}
