"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { GoogleIcon, FacebookIcon } from "@/components/auth/provider-icons";
import { createClient } from "@/utils/supabase/client";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth: "We could not complete that sign-in. Please try again.",
  missing_code: "That sign-in link was incomplete. Please try again.",
  invalid_link:
    "That link is invalid or has expired. Please request a new one.",
  access_denied: "Sign-in was cancelled.",
  server_error: "The sign-in provider had a problem. Please try again.",
};

function describeAuthError(code: string | null, detail: string | null) {
  if (!code) return null;
  const base = AUTH_ERROR_MESSAGES[code] ?? "Sign-in failed.";
  return detail ? `${base} (${detail})` : base;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = searchParams.get("from");
  const nextPath =
    from && from.startsWith("/") && !from.startsWith("//") ? from : null;
  // Surfaced by app/auth/callback/route.ts when the OAuth exchange fails.
  const callbackError = describeAuthError(
    searchParams.get("error"),
    searchParams.get("detail"),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setSubmitting(false);
      setError(signInError.message);
      return;
    }

    router.replace(nextPath ?? "/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">
          Sign in to Cataloo
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Manage and share your catalog.
        </p>

        {callbackError ? (
          <div
            role="alert"
            className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {callbackError}
          </div>
        ) : null}

        <div className="space-y-3">
          <OAuthButton
            provider="google"
            label="Continue with Google"
            icon={<GoogleIcon />}
            next={nextPath}
          />
          <OAuthButton
            provider="facebook"
            label="Continue with Facebook"
            icon={<FacebookIcon />}
            next={nextPath}
          />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          OR
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-gray-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-gray-900 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
