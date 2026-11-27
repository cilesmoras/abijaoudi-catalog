import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, Section } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Cataloo",
  description: "How Cataloo collects, uses and protects personal data.",
};

export default function PrivacyPage() {
  const mail = `mailto:${LEGAL.supportEmail}`;
  return (
    <LegalDoc title="Privacy Policy">
      <Section title="1. Who is responsible for your data">
        <p>
          Cataloo is operated by {LEGAL.operator}, based in {LEGAL.location}{" "}
          (&quot;we&quot;, &quot;us&quot;). We are the personal information
          controller for the data described here, and we follow the
          Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its
          implementing rules. For any privacy question or request, email{" "}
          <a href={mail}>{LEGAL.supportEmail}</a>.
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>
          <strong>From catalog owners (people with a Cataloo account):</strong>
        </p>
        <ul>
          <li>
            <strong>Account data</strong> — your email address and login
            details. If you sign in with Google or Facebook, we receive your
            email address and basic profile from that provider; we never see
            your password there.
          </li>
          <li>
            <strong>Catalog data</strong> — the catalog name, link (handle),
            business phone number, contact email, address, country, currency,
            social media links, logo, and the products, photos, prices,
            categories and options you add. Most of this is shown publicly on
            your catalog, because that is the purpose of the service.
          </li>
          <li>
            <strong>Billing data</strong> — if you subscribe to Pro, Paddle
            (our payment reseller) collects your payment details. We receive
            only your subscription status, plan, billing period and a Paddle
            customer ID. <strong>We never see or store your card number.</strong>
          </li>
          <li>
            <strong>Messages</strong> — what you send us through the
            in-app feedback form, upgrade requests or email.
          </li>
        </ul>
        <p>
          <strong>From visitors to public catalogs:</strong> for Pro
          catalogs, we count page views and which items are opened, so the
          owner can see simple analytics. These events store only the
          catalog, the item and the time —{" "}
          <strong>
            not your IP address, device details, or anything that identifies
            you
          </strong>
          . If you order from a catalog through WhatsApp, that conversation
          happens directly between you and the seller; Cataloo does not
          receive it.
        </p>
        <p>
          <strong>Technical data:</strong> our hosting providers keep standard
          server logs (such as IP address, browser type and request time) for
          security and troubleshooting.
        </p>
      </Section>

      <Section title="3. Why we use it">
        <ul>
          <li>
            To provide the service you signed up for: create your account,
            host and display your catalog, and generate PDFs (performance of a
            contract).
          </li>
          <li>To process Pro subscriptions and keep billing records (contract and legal obligation).</li>
          <li>
            To send essential emails, like sign-in links, password resets and
            important account or policy notices (contract).
          </li>
          <li>
            To keep Cataloo secure, prevent abuse and enforce our{" "}
            <Link href="/terms">Terms</Link> (legitimate interest).
          </li>
          <li>To reply to your messages and improve the product (legitimate interest).</li>
        </ul>
        <p>
          We do not sell your personal data, and we do not use it for
          third-party advertising.
        </p>
      </Section>

      <Section title="4. Who we share it with">
        <p>We use a small number of trusted service providers to run Cataloo:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — database, authentication and photo
            storage.
          </li>
          <li>
            <strong>Vercel</strong> — website hosting.
          </li>
          <li>
            <strong>Resend</strong> — sending emails, such as feedback you
            send us.
          </li>
          <li>
            <strong>Paddle</strong> — our Merchant of Record, which processes
            payments, taxes, invoices and refunds for Pro. Paddle handles your
            billing data under its own{" "}
            <a
              href="https://www.paddle.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Google and Facebook</strong> — only if you choose to sign
            in with them.
          </li>
        </ul>
        <p>
          We may also disclose data if the law requires it, or to protect the
          rights and safety of our users or the public.
        </p>
      </Section>

      <Section title="5. International transfers">
        <p>
          Our providers may store and process data outside the Philippines
          (for example, in the United States or the European Union). We only
          use providers that protect data with appropriate security and
          contractual safeguards.
        </p>
      </Section>

      <Section title="6. Cookies">
        <p>
          We use only cookies that are needed to keep you signed in and to
          keep the service secure. We do not use advertising or third-party
          tracking cookies. Paddle&apos;s checkout may set its own cookies
          when you buy Pro, to process the payment and prevent fraud.
        </p>
      </Section>

      <Section title="7. How long we keep it">
        <ul>
          <li>Account and catalog data — for as long as your account exists.</li>
          <li>Analytics events — while your account exists; they are deleted with it.</li>
          <li>
            Billing records — as long as tax and accounting laws require,
            even after your account is deleted.
          </li>
          <li>Server logs — for a short period, usually a few weeks.</li>
        </ul>
      </Section>

      <Section title="8. Your rights">
        <p>Under the Data Privacy Act, you have the right to:</p>
        <ul>
          <li>be informed about how your data is used;</li>
          <li>access a copy of your personal data;</li>
          <li>correct inaccurate data (most of it you can edit in your dashboard);</li>
          <li>object to processing, or ask us to erase or block your data;</li>
          <li>receive your data in a portable format;</li>
          <li>
            complain to the{" "}
            <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer">
              National Privacy Commission
            </a>
            .
          </li>
        </ul>
        <p>
          <strong>To delete your account</strong>, or to make any other
          request, email <a href={mail}>{LEGAL.supportEmail}</a> from the
          address on your account. We will respond and, for deletion, remove
          your account, catalog and photos within 30 days, except records we
          must keep by law. Cancel any Pro subscription first so you are not
          charged again.
        </p>
      </Section>

      <Section title="9. Security">
        <p>
          We protect data with encrypted connections (HTTPS), access controls
          that keep each owner&apos;s data separate, and reputable
          infrastructure providers. No system is perfectly secure; if a breach
          affects your personal data, we will notify you and the National
          Privacy Commission as the law requires.
        </p>
      </Section>

      <Section title="10. Children">
        <p>
          Cataloo is for people aged 18 and over. We do not knowingly collect
          data from children. If you believe a child has created an account,
          contact us and we will delete it.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this policy. If a change is significant, we will
          notify you by email or in the dashboard. The date at the top shows
          when it was last updated.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          {LEGAL.operator}, {LEGAL.location} ·{" "}
          <a href={mail}>{LEGAL.supportEmail}</a>
        </p>
      </Section>
    </LegalDoc>
  );
}
