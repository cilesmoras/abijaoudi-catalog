import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
