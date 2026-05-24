import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
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
  const bucketName = "item-images";

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) {
    const message = error.message.toLowerCase().includes("bucket")
      ? `Storage bucket "${bucketName}" not found. Create it in Supabase Storage.`
      : error.message;
    return Response.json({ error: message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return Response.json({ url: urlData.publicUrl }, { status: 201 });
}
