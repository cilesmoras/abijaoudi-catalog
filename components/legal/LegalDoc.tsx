import { LEGAL } from "@/lib/legal";

/** Shared typography for the legal pages (no Tailwind typography plugin). */
export function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-8 text-[15px] leading-7 text-gray-700 [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1.5">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Last updated: {LEGAL.lastUpdated}
        </p>
      </header>
      {children}
    </article>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
