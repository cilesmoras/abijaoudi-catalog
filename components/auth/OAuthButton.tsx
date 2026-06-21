"use client";

import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

type OAuthButtonProps = {
  provider: "google" | "facebook";
  label: string;
  icon: ReactNode;
};

export function OAuthButton({ provider, label, icon }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setLoading(false);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={loading}
      onClick={() => void signIn()}
    >
      {loading ? (
        "Redirecting…"
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );
}
