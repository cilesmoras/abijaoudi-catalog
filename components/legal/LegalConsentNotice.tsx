import Link from "next/link";

/**
 * Sign-in-wrap notice shown under the auth forms. Covers both email signup and
 * OAuth (Google/Facebook), which have no form to hang a checkbox on.
 */
export function LegalConsentNotice() {
  return (
    <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
      By continuing, you agree to Cataloo&apos;s{" "}
      <Link href="/terms" className="underline underline-offset-2 hover:text-gray-900">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-900">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
