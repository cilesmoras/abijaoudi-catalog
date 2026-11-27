import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, Section } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund Policy | Cataloo",
  description: "Refunds and cancellations for Cataloo Pro.",
};

export default function RefundPage() {
  const mail = `mailto:${LEGAL.supportEmail}`;
  const days = LEGAL.refundWindowDays;
  return (
    <LegalDoc title="Refund Policy">
      <Section title={`${days}-day money-back guarantee`}>
        <p>
          If Cataloo Pro isn&apos;t right for you, you can ask for a full
          refund within <strong>{days} days</strong> of your first payment, or
          within {days} days of a renewal payment. This applies to both monthly
          and yearly plans. No questions asked.
        </p>
      </Section>

      <Section title="How to request a refund">
        <p>
          Payments for Cataloo are processed by our reseller and Merchant of
          Record, <strong>Paddle.com</strong>. To request a refund, either:
        </p>
        <ul>
          <li>
            email <a href={mail}>{LEGAL.supportEmail}</a> from the address on
            your account, or
          </li>
          <li>
            use the link in your Paddle receipt email, or contact Paddle at{" "}
            <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">
              paddle.net
            </a>
            .
          </li>
        </ul>
        <p>
          Refunds go back to your original payment method through Paddle.
          Depending on your bank, it can take 5–10 business days to appear.
          When a refund is issued, your subscription is canceled and your
          account returns to the Free plan.
        </p>
      </Section>

      <Section title={`After ${days} days`}>
        <p>
          After the {days}-day window, payments are non-refundable, except
          where the law requires otherwise. You can still cancel at any time:
          you keep Pro until the end of the period you already paid for, and
          you won&apos;t be charged again.
        </p>
      </Section>

      <Section title="Exceptions">
        <p>
          We may refuse a refund if an account was closed for breaking our{" "}
          <Link href="/terms">Terms</Link>, or if we see repeated refund
          requests that look like abuse. This doesn&apos;t affect any rights
          you have under consumer protection law.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions? Email <a href={mail}>{LEGAL.supportEmail}</a>.
        </p>
      </Section>
    </LegalDoc>
  );
}
