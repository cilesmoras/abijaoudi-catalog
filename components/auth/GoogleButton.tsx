"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setLoading(false);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={() => void signIn()}
    >
      {loading ? "Redirecting…" : label}
    </Button>
  );
}
