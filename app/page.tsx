import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Share2,
  Sparkles,
  Store,
} from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/Reveal";
import { HeroBackground } from "@/components/landing/HeroBackground";

const features = [
  {
    icon: Store,
    title: "Your own catalog",
    description:
      "Add products with photos, prices, descriptions, and categories — all in one place.",
  },
  {
    icon: Share2,
    title: "One shareable link",
    description:
      "Send customers a single link to your catalog at cataloo.app/your-handle.",
  },
  {
    icon: MessageCircle,
    title: "Orders on WhatsApp",
    description:
      "Customers pick what they want and send you a ready-to-go WhatsApp order.",
  },
];

const steps = [
  { title: "Sign up free", description: "Create an account with Google or email." },
  {
    title: "Build your catalog",
    description: "Add your items, photos, and contact details.",
  },
  {
    title: "Share your link",
    description: "Send customers your handle and start taking orders.",
  },
];

const faqs = [
  {
    q: "Is Cataloo free?",
    a: "Yes — Cataloo is free to use, with generous limits. A Pro plan with unlimited catalogs and items, multiple photos, a custom link, and more is coming soon.",
  },
  {
    q: "Do my customers need an account?",
    a: "No. Anyone with your link can browse your catalog and place a WhatsApp order.",
  },
  {
    q: "Can I change my handle later?",
    a: "Yes, you can update your handle, catalog name, and contact info anytime in settings.",
  },
];

const planComparison = [
  { feature: "Catalogs", free: "1", pro: "Unlimited" },
  { feature: "Items per catalog", free: "30", pro: "Unlimited" },
  { feature: "Photos per item", free: "1, compressed", pro: "Multiple, full quality" },
  {
    feature: "Public share link",
    free: 'Yes, "Made with Cataloo" badge',
    pro: "Badge removed",
  },
  { feature: "Custom link", free: "Random ID", pro: "cataloo.app/yourbrand" },
  { feature: "PDF export", free: "Watermarked", pro: "Watermark-free, your logo" },
  { feature: "Analytics", free: "None", pro: "Views, top items" },
  { feature: "Support", free: "Email, best-effort", pro: "Priority" },
];

const previewProducts = [
  { name: "Sourdough loaf", price: "$6.50", tint: "from-amber-200 to-orange-300" },
  { name: "Almond croissant", price: "$4.00", tint: "from-rose-200 to-pink-300" },
  { name: "Cinnamon roll", price: "$3.75", tint: "from-yellow-200 to-amber-300" },
  { name: "Baguette", price: "$3.20", tint: "from-orange-200 to-amber-300" },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon-192x192.png"
              alt="Cataloo"
              width={32}
              height={32}
              priority
              className="h-8 w-8 rounded-lg shadow-sm shadow-blue-600/20"
            />
            <span className="text-xl font-bold tracking-tight">Cataloo</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="#pricing">Pricing</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-600/20 hover:opacity-90"
                >
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 pb-24 pt-20 text-center sm:pt-28"
        style={{ isolation: "isolate" }}
      >
        <HeroBackground />

        <Reveal className="mx-auto w-full max-w-4xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-50/80 px-3.5 py-1.5 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Free to start — no card required
          </span>
          <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Share your products with{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 bg-clip-text text-transparent">
              a single link
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Cataloo lets you build a beautiful online catalog and share it with
            your customers in seconds. They browse, pick, and order on WhatsApp.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="group bg-gradient-to-r from-blue-500 to-indigo-600 px-7 shadow-lg shadow-blue-600/25 transition-opacity hover:opacity-90"
            >
              <Link href={user ? "/dashboard" : "/signup"}>
                {user ? "Go to dashboard" : "Create your catalog"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            {!user ? (
              <Button size="lg" variant="outline" asChild className="px-7">
                <Link href="/login">Log in</Link>
              </Button>
            ) : null}
          </div>
        </Reveal>

        {/* Mock catalog preview */}
        <Reveal
          delay={120}
          className="mx-auto mt-16 w-full max-w-3xl"
        >
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 shadow-2xl shadow-blue-900/10 backdrop-blur">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-200/80 bg-gray-50/80 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <div className="ml-3 flex-1 rounded-md border border-gray-200 bg-white px-3 py-1 text-left font-mono text-xs text-gray-500">
                cataloo.app/<span className="text-blue-600">marias-bakery</span>
              </div>
            </div>
            {/* Catalog body */}
            <div className="p-5 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Maria&apos;s Bakery
                  </p>
                  <p className="text-xs text-gray-500">Fresh daily · Order on WhatsApp</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {previewProducts.map((product) => (
                  <div
                    key={product.name}
                    className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm"
                  >
                    <div
                      className={`h-16 w-full rounded-lg bg-gradient-to-br ${product.tint}`}
                    />
                    <p className="mt-2 truncate text-xs font-medium text-gray-800">
                      {product.name}
                    </p>
                    <p className="text-xs font-semibold text-blue-600">
                      {product.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-b from-white to-gray-50/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to sell
            </h2>
            <p className="mt-4 text-gray-600">
              No website to build, no app for customers to install.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 100}>
                <div className="group h-full rounded-2xl border border-gray-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/25 transition-transform duration-300 group-hover:scale-105">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-gray-600">Live in three simple steps.</p>
        </Reveal>
        <div className="relative mt-16 grid gap-10 md:grid-cols-3">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent md:block" />
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 120} className="relative text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-600/25 ring-8 ring-white">
                {index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Example */}
      <section className="bg-gradient-to-b from-gray-50/60 to-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              A link your customers will remember
            </h2>
            <p className="mt-4 text-gray-600">
              Every catalog gets a clean, shareable address:
            </p>
            <div className="mx-auto mt-7 inline-flex items-center rounded-xl border border-gray-200 bg-white/80 px-6 py-3.5 font-mono text-lg shadow-lg shadow-blue-900/5 backdrop-blur">
              cataloo.app/
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text font-semibold text-transparent">
                marias-bakery
              </span>
            </div>
          </Reveal>
          <Reveal delay={100} className="mx-auto mt-10 max-w-md">
            <ul className="space-y-3 text-left">
              {[
                "Photos, prices, and categories",
                "Search and filter built in",
                "Phone, email, and address shown to customers",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 rounded-xl border border-gray-200/70 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="scroll-mt-20 bg-gradient-to-b from-white to-gray-50/60 py-24"
      >
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-gray-600">
              Start free with everything you need. Pro is on the way for sellers
              who want more.
            </p>
          </Reveal>

          {/* Mobile: one card per plan */}
          <Reveal delay={100} className="mt-12 space-y-6 md:hidden">
            {/* Free card */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-lg shadow-blue-900/5">
              <p className="text-sm font-semibold text-gray-900">Free</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                $0
                <span className="ml-1 text-sm font-medium text-gray-500">
                  forever
                </span>
              </p>
              <Button
                asChild
                className="mt-5 w-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-600/20 hover:opacity-90"
              >
                <Link href={user ? "/dashboard" : "/signup"}>
                  {user ? "Go to dashboard" : "Get started free"}
                </Link>
              </Button>
              <ul className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                {planComparison.map((row) => (
                  <li
                    key={row.feature}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <span className="text-gray-500">{row.feature}</span>
                    <span className="text-right font-medium text-gray-800">
                      {row.free}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro card */}
            <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/70 to-white p-6 shadow-lg shadow-blue-900/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Pro</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                $9
                <span className="ml-1 text-sm font-medium text-gray-500">/mo</span>
              </p>
              <p className="text-xs text-gray-500">or $79/yr · ~2 months free</p>
              <Button
                disabled
                className="mt-5 w-full cursor-not-allowed bg-gray-200 text-gray-500 hover:bg-gray-200"
              >
                Coming soon
              </Button>
              <ul className="mt-6 space-y-3 border-t border-blue-100 pt-5">
                {planComparison.map((row) => (
                  <li
                    key={row.feature}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <span className="text-gray-500">{row.feature}</span>
                    <span className="text-right font-medium text-gray-800">
                      {row.pro}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Desktop: comparison table */}
          <Reveal delay={100} className="mt-14 hidden md:block">
            <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-blue-900/5">
              {/* Plan headers */}
              <div className="grid grid-cols-[1.2fr_1fr_1.1fr]">
                <div className="border-b border-gray-200/80 p-4 sm:p-6" />
                <div className="border-b border-l border-gray-200/80 p-4 text-center sm:p-6">
                  <p className="text-sm font-semibold text-gray-900">Free</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                    $0
                  </p>
                  <p className="text-xs text-gray-500">forever</p>
                </div>
                <div className="relative border-b border-l border-gray-200/80 bg-gradient-to-b from-blue-50/80 to-indigo-50/40 p-4 text-center sm:p-6">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    Coming soon
                  </span>
                  <p className="mt-2 text-sm font-semibold text-gray-900">Pro</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                    $9
                    <span className="text-sm font-medium text-gray-500">/mo</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    or $79/yr · ~2 months free
                  </p>
                </div>
              </div>

              {/* Feature rows */}
              {planComparison.map((row) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-[1.2fr_1fr_1.1fr] border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center p-4 text-xs font-medium text-gray-900 sm:p-5 sm:text-sm">
                    {row.feature}
                  </div>
                  <div className="flex items-center justify-center border-l border-gray-100 p-4 text-center text-xs text-gray-600 sm:p-5 sm:text-sm">
                    {row.free}
                  </div>
                  <div className="flex items-center justify-center border-l border-gray-100 bg-blue-50/30 p-4 text-center text-xs font-medium text-gray-800 sm:p-5 sm:text-sm">
                    {row.pro}
                  </div>
                </div>
              ))}

              {/* CTA row */}
              <div className="grid grid-cols-[1.2fr_1fr_1.1fr] border-t border-gray-200/80 bg-gray-50/40">
                <div className="hidden p-4 sm:block sm:p-6" />
                <div className="col-span-2 flex flex-col gap-3 p-4 sm:col-span-1 sm:border-l sm:border-gray-200/80 sm:p-6">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-600/20 hover:opacity-90"
                  >
                    <Link href={user ? "/dashboard" : "/signup"}>
                      {user ? "Go to dashboard" : "Get started free"}
                    </Link>
                  </Button>
                </div>
                <div className="hidden border-l border-gray-200/80 bg-blue-50/30 p-6 sm:block">
                  <Button
                    disabled
                    className="w-full cursor-not-allowed bg-gray-200 text-gray-500 hover:bg-gray-200"
                  >
                    Coming soon
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-6 py-24">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <Reveal key={faq.q} delay={index * 80}>
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {faq.a}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="px-6 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 px-8 py-16 text-center shadow-2xl shadow-blue-900/20">
            <div
              aria-hidden="true"
              className="animate-float absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl"
            />
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start sharing your catalog today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-50">
              It&apos;s free to get started. Build your catalog and send your
              first link in minutes.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                asChild
                className="group bg-white px-7 text-blue-700 shadow-lg hover:bg-white/90"
              >
                <Link href={user ? "/dashboard" : "/signup"}>
                  {user ? "Go to dashboard" : "Get started for free"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <Image
              src="/icon-192x192.png"
              alt="Cataloo"
              width={24}
              height={24}
              className="h-6 w-6 rounded-md"
            />
            <span className="font-semibold text-gray-900">Cataloo</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Cataloo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
