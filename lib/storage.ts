import { createClient } from "@supabase/supabase-js";

const bucketName = "item-images";

// Extracts the in-bucket object path from a Supabase public URL,
// e.g. ".../object/public/item-images/123-abc.jpg" -> "123-abc.jpg".
function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${bucketName}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

// Removes an item's catalog + thumbnail images from Supabase storage.
// Failures are logged but never thrown — image cleanup is best-effort and
// should not fail the surrounding delete operation.
export async function deleteItemImages(
  ...urls: (string | null | undefined)[]
): Promise<void> {
  const paths = urls
    .map(storagePathFromUrl)
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Use service role key on the server so storage RLS is bypassed.
  const supabase = createClient(supabaseUrl, serviceRoleKey ?? anonKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.storage.from(bucketName).remove(paths);
  if (error) {
    console.error("Failed to delete item images from storage:", error);
  }
}
