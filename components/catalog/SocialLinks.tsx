import { Facebook, Instagram } from "lucide-react";
import type { Profile } from "@/lib/types";

// lucide-react has no TikTok glyph, so use the official mark as an inline SVG.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.5 3a5.4 5.4 0 0 0 4.5 4.5v3a8.4 8.4 0 0 1-4.5-1.3v6.3a6 6 0 1 1-6-6c.34 0 .67.03 1 .08v3.1a3 3 0 1 0 2 2.82V3h3Z" />
    </svg>
  );
}

const LINK_CLASS =
  "inline-flex items-center gap-1.5 hover:text-gray-900";

/**
 * Pro-only social links for the public catalog header. Renders nothing when the
 * owner has set none (which is always the case on Free, since the fields are
 * gated in settings).
 */
export function SocialLinks({ profile }: { profile: Profile }) {
  const links = [
    { url: profile.facebook_url, label: "Facebook", Icon: Facebook },
    { url: profile.instagram_url, label: "Instagram", Icon: Instagram },
    { url: profile.tiktok_url, label: "TikTok", Icon: TikTokIcon },
  ].filter((link): link is typeof link & { url: string } => Boolean(link.url));

  if (links.length === 0) return null;

  return (
    <>
      {links.map(({ url, label, Icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
          {label}
        </a>
      ))}
    </>
  );
}
