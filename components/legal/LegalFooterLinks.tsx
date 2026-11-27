import Link from "next/link";
import { LEGAL } from "@/lib/legal";

const LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refunds" },
];

/** Footer links Paddle's review expects within two clicks of the homepage. */
export function LegalFooterLinks() {
  return (
    <nav
      aria-label="Legal"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-500"
    >
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-gray-900">
          {link.label}
        </Link>
      ))}
      <a href={`mailto:${LEGAL.supportEmail}`} className="hover:text-gray-900">
        {LEGAL.supportEmail}
      </a>
    </nav>
  );
}
