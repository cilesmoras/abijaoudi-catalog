import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Singleton for client components
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;
export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createSupabaseClient();
  }
  return clientInstance;
}
