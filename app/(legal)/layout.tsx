import Image from "next/image";
import Link from "next/link";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { LEGAL } from "@/lib/legal";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <header className="border-b border-gray-200/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon-192x192.png"
              alt="Cataloo"
              width={24}
              height={24}
              className="h-6 w-6 rounded-md"
            />
            <span className="font-semibold">Cataloo</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-gray-200/70 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Cataloo · {LEGAL.operator}
          </p>
          <LegalFooterLinks />
        </div>
      </footer>
    </div>
  );
}
