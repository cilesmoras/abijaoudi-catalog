import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, Section } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/legal";
import { FREE_ITEM_LIMIT, PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Terms of Service | Cataloo",
  description: "The terms that apply when you use Cataloo.",
};

export default function TermsPage() {
  const mail = `mailto:${LEGAL.supportEmail}`;
  return (
    <LegalDoc title="Terms of Service">
      <Section title="1. Who we are">
        <p>
          Cataloo (&quot;Cataloo&quot;, &quot;we&quot;, &quot;us&quot;) is an
          online service at {LEGAL.siteUrl.replace("https://", "")} that lets
          businesses create and share a digital product catalog. Cataloo is
          operated by {LEGAL.operator}, an individual based in{" "}
          {LEGAL.location}. You can reach us at{" "}
          <a href={mail}>{LEGAL.supportEmail}</a>.
        </p>
        <p>
          By creating an account or using Cataloo, you agree to these Terms
          and to our <Link href="/privacy">Privacy Policy</Link>. If you do not
          agree, please do not use Cataloo.
        </p>
      </Section>

      <Section title="2. Eligibility and your account">
        <ul>
          <li>You must be at least 18 years old to create an account.</li>
          <li>
            You must give accurate information and keep your login details
            secure. You are responsible for everything that happens under your
            account.
          </li>
          <li>
            If you use Cataloo on behalf of a business, you confirm you are
            allowed to accept these Terms for that business.
          </li>
        </ul>
      </Section>

      <Section title="3. The service">
        <p>
          Cataloo lets you list products with photos, prices and
          descriptions, share a public link to your catalog, export it as a
          PDF, and receive orders from your customers through WhatsApp or
          other channels you choose.
        </p>
        <p>
          Cataloo is a catalog tool only.{" "}
          <strong>
            Cataloo is not a party to any sale between you and your customers
          </strong>
          . We do not process payments for your products, deliver goods, or
          handle customer disputes. You are solely responsible for your
          products, prices, taxes, deliveries, refunds to your customers, and
          compliance with the laws that apply to your business.
        </p>
      </Section>

      <Section title="4. Plans and pricing">
        <ul>
          <li>
            <strong>Free</strong> — no charge, with limits (for example, up to{" "}
            {FREE_ITEM_LIMIT} items, one photo per item, and a &quot;Made with
            Cataloo&quot; badge).
          </li>
          <li>
            <strong>Pro</strong> — US${PRO_PRICE_MONTHLY} per month or US$
            {PRO_PRICE_YEARLY} per year, plus any applicable sales tax or VAT.
            Pro removes the Free limits and adds features described on our{" "}
            <Link href="/#pricing">pricing section</Link>.
          </li>
        </ul>
        <p>
          We may change features or prices. Price changes will not affect a
          billing period you have already paid for, and we will tell you
          before a new price applies to your subscription.
        </p>
      </Section>

      <Section title="5. Payments, renewals and cancellation">
        <p>
          Our order process is conducted by our online reseller{" "}
          <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer">
            Paddle.com
          </a>
          . Paddle.com is the Merchant of Record for all our orders. Paddle
          provides all customer service inquiries and handles returns. Your
          purchase is also subject to{" "}
          <a
            href="https://www.paddle.com/legal/checkout-buyer-terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Paddle&apos;s Buyer Terms
          </a>
          .
        </p>
        <ul>
          <li>
            Pro is a subscription that <strong>renews automatically</strong>{" "}
            at the end of each monthly or yearly period until you cancel.
          </li>
          <li>
            You can cancel at any time from your dashboard. When you cancel,
            you keep Pro until the end of the period you already paid for, and
            you will not be charged again.
          </li>
          <li>
            If a renewal payment fails, Paddle may retry it. If payment cannot
            be collected, your subscription will be canceled and your account
            will return to the Free plan.
          </li>
          <li>
            Refunds are covered by our <Link href="/refund">Refund Policy</Link>
            .
          </li>
        </ul>
        <p>
          When your account returns to Free, your content is kept, but Free
          limits apply again (for example, items above the Free limit cannot
          be added, and Pro-only features stop working).
        </p>
      </Section>

      <Section title="6. Your content">
        <p>
          You own the content you add to Cataloo, such as product names,
          photos, prices and contact details. You give us a worldwide,
          non-exclusive, royalty-free licence to host, store, resize, display
          and share that content only as needed to run Cataloo for you —
          including showing your catalog to anyone with its link.
        </p>
        <p>
          You confirm that you have the rights to everything you upload and
          that your content is accurate and lawful.
        </p>
      </Section>

      <Section title="7. Acceptable use">
        <p>You must not use Cataloo to list, promote or sell:</p>
        <ul>
          <li>anything illegal where you or your customers are located;</li>
          <li>counterfeit goods, or content that infringes anyone&apos;s intellectual property;</li>
          <li>weapons, ammunition, explosives or illegal drugs;</li>
          <li>
            regulated products such as tobacco, vaping products, alcohol,
            prescription medicines or supplements with health claims, unless
            you hold every licence the law requires;
          </li>
          <li>adult or sexually explicit content;</li>
          <li>gambling, financial schemes, or misleading &quot;get rich&quot; offers;</li>
          <li>hateful, harassing, violent or deceptive content.</li>
        </ul>
        <p>You must also not:</p>
        <ul>
          <li>try to access other people&apos;s accounts or data;</li>
          <li>disrupt, overload, scrape or reverse-engineer the service;</li>
          <li>use Cataloo to send spam or to collect personal data unlawfully.</li>
        </ul>
      </Section>

      <Section title="8. Suspension and removal">
        <p>
          We may remove content, or suspend or close an account, if we
          reasonably believe it breaks these Terms, puts other users at risk,
          or is required by law. Where reasonable, we will tell you first and
          give you a chance to fix the problem. If we close a paid account
          because you broke these Terms, you are not entitled to a refund for
          the remaining period.
        </p>
        <p>
          To report content that breaks these Terms, email{" "}
          <a href={mail}>{LEGAL.supportEmail}</a> with the catalog link.
        </p>
      </Section>

      <Section title="9. Closing your account">
        <p>
          You can stop using Cataloo at any time. To delete your account and
          its data, email <a href={mail}>{LEGAL.supportEmail}</a> from the
          address on your account. Cancel any Pro subscription first so you
          are not charged again. See our{" "}
          <Link href="/privacy">Privacy Policy</Link> for how deletion works.
        </p>
      </Section>

      <Section title="10. Availability and changes to the service">
        <p>
          We work to keep Cataloo running, but we do not promise it will
          always be available or free of errors. We may add, change or remove
          features. If we ever shut Cataloo down, we will give you reasonable
          notice and refund any unused part of a prepaid Pro period.
        </p>
      </Section>

      <Section title="11. Disclaimers">
        <p>
          Cataloo is provided &quot;as is&quot; and &quot;as available&quot;.
          To the fullest extent the law allows, we disclaim all warranties,
          express or implied, including fitness for a particular purpose and
          non-infringement. We are not responsible for your products, your
          customers, or orders placed through your catalog.
        </p>
      </Section>

      <Section title="12. Limitation of liability">
        <p>
          To the fullest extent the law allows, we are not liable for
          indirect or consequential losses, such as lost profits, lost sales
          or lost data. Our total liability to you for any claim related to
          Cataloo is limited to the amount you paid us in the 12 months
          before the claim, or US$50 if you have not paid us anything. Nothing
          in these Terms limits liability that cannot be limited by law.
        </p>
      </Section>

      <Section title="13. Indemnity">
        <p>
          You agree to cover any claims, losses or costs brought against us
          by third parties that arise from your content, your products or
          sales, or your breach of these Terms.
        </p>
      </Section>

      <Section title="14. Governing law">
        <p>
          These Terms are governed by the laws of the Republic of the
          Philippines. Any dispute will be handled by the competent courts of
          Pagadian City, Philippines, unless the law where you live gives you
          the right to bring a claim locally. Before going to court, please
          contact us so we can try to resolve the issue informally.
        </p>
      </Section>

      <Section title="15. Changes to these Terms">
        <p>
          We may update these Terms. If a change is significant, we will
          notify you by email or in the dashboard before it takes effect.
          Continuing to use Cataloo after the change means you accept the
          updated Terms.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>
          {LEGAL.operator}, {LEGAL.location} ·{" "}
          <a href={mail}>{LEGAL.supportEmail}</a>
        </p>
      </Section>
    </LegalDoc>
  );
}
