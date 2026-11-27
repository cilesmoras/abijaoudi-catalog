# Cataloo × Paddle integration plan

**Goal:** Cataloo Pro is sold and managed end-to-end through Paddle (merchant of record), with the legal pages Paddle requires for domain and account approval.

_Agreed 2026-11-26._

## Agreed decisions

| Topic | Decision |
|---|---|
| Seller | Cesar Ian Lesmoras, individual (sole trader), Pagadian City, Philippines (city + country only on public pages) |
| Governing law | Philippines; privacy under the Data Privacy Act of 2012 (RA 10173) |
| Price | **$10/mo or $100/yr** (~17% off, about 2 months free). Shown again on the landing page (replaces "Contact for pricing") |
| Refunds | 14 days (Paddle standard) |
| Trial | None (the Free tier is the trial) |
| Existing Pro | `abijaoudi-supermarket` and `sample-store`: free Pro forever (comp). `deuprh`: keeps Pro until 2026-12-19, then subscribes. `vxkf3a`: already expired (2026-07-26), goes back to Free at launch |
| Checkout | Paddle overlay (popup) from the dashboard, email prefilled |
| Billing self-service | Paddle customer portal via a "Manage billing" button |
| Losing Pro | Cancel: Pro stays until the end of the paid period. Failed payment: Pro stays while Paddle retries; drops to Free when the subscription is canceled |
| Contact | support@cataloo.app (footer + legal pages) |
| Signup consent | Notice line: "By signing up you agree to the Terms and Privacy Policy" |
| Minimum age | 18+ |
| Content rules | Standard acceptable-use rules plus a takedown/suspension right in the Terms |
| Account deletion | By email request, done within 30 days (no self-serve button yet) |
| Rollout | Sandbox on the `dev` Vercel preview first; live account + domain approval in parallel |

---

## Phase 1: Legal pages and getting the site ready for Paddle review

Gets `cataloo.app` ready for Paddle's domain review, so the domain can be submitted early. No dependency on Paddle.

1. **Add `/terms`, `/privacy` and `/refund`.** Plain pages sharing one layout, each with a "last updated" date.
   - **Terms:**
     - Seller is Cesar Ian Lesmoras, Pagadian City, Philippines.
     - Paddle.com is the merchant of record and reseller for all payments.
     - Free and Pro plans; automatic renewal at $10/mo or $100/yr; cancel any time and Pro lasts until the end of the period.
     - 18 or older only.
     - Content rules (no illegal, counterfeit, adult or regulated goods); owners are responsible for their own listings and sales; Cataloo may remove content or suspend accounts.
     - No warranty; limit on liability.
     - Philippine law and courts.
   - **Privacy:**
     - Follows RA 10173.
     - What's collected: account email, profile and catalog content, and view counts without IP addresses.
     - Processors: Supabase, Vercel, Resend and Paddle. Paddle handles payment data; Cataloo never sees card numbers.
     - Cookies: only the ones needed to stay logged in.
     - User rights; deletion within 30 days by emailing support@cataloo.app.
   - **Refund:** 14-day refund, requested through Paddle or support (matches Paddle's standard policy).
2. **Footer links** to Terms, Privacy, Refund and support@cataloo.app on the landing page, plus a smaller footer on public catalog pages.
3. **Prices back on the landing page:** $10/mo and $100/yr on the Pro card and in the comparison table; pricing FAQ updated to match.
4. **Consent line** on the signup and login pages ("By signing up you agree to the Terms and Privacy Policy"). Covers email signup and Google sign-in.
5. **Reserve handles** `refund`, `billing`, `checkout`, `legal`, `upgrade`, `welcome` and `paddle` in `lib/handles.ts`. Checked 2026-11-26: no existing catalog uses any of them.

**→ Ian:** submit `cataloo.app` in the Paddle live account under **My account → Settings → Website approval**, then start account verification.

## Phase 2: Database changes for subscriptions

1. **Migration `drizzle/0006_paddle_billing.sql`:**
   - New `profiles` columns:
     - `paddle_customer_id`
     - `paddle_subscription_id`
     - `subscription_status`
     - `current_period_end`
     - `cancel_at_period_end` (boolean)
     - `billing_interval`
     - `pro_source` (`comp` | `paddle`)
   - New table `paddle_webhook_events`: each Paddle event id, unique, so a re-delivered event is never processed twice.
     - `ENABLE ROW LEVEL SECURITY`, no policies, no grants (per AGENTS.md). Only the postgres connection and the webhook touch it, never `app_owner`.
   - **Billing columns stay postgres-only,** like the other plan/upgrade fields in AGENTS.md. No `app_owner` grants.
2. **Backfill comps:**
   - `abijaoudi-supermarket` and `sample-store` get `pro_source = 'comp'` (free Pro forever).
   - `deuprh` stays Pro until 2026-12-19, then is asked to subscribe.
   - `vxkf3a`'s term already ended, so it goes back to Free at launch.
3. **`profiles.plan` stays the one feature gate** (`isPro` unchanged). The webhook writes `plan` using `planForSubscriptionStatus()` in `lib/plans.ts`: `active`, `trialing` and `past_due` keep Pro; `canceled` and `paused` mean Free. Paddle keeps a subscription `active` until the end of a canceled period, so no date math is needed. Comp profiles are never touched. `PRO_TERM_DAYS` and the manual expiry stay only as an admin fallback.
4. **Billing fields are not added to the shared `Profile` type**, because it's passed to public catalog pages. The dashboard reads them through a separate billing query (Phase 6).

**Status (2026-11-27):** migration applied; comps backfilled; RLS test extended (owners can't write billing columns or read `paddle_webhook_events`). `vxkf3a` is still Pro until the go-live cleanup.

## Phase 3: Paddle setup in sandbox

1. **Create the Cataloo Pro product** with two recurring prices: $10/month and $100/year. Use the Paddle tools once their connection works, otherwise a Node SDK seed script.
2. **Environment variables** (also added to `.env.example`):
   - `PADDLE_API_KEY` (server only)
   - `PADDLE_WEBHOOK_SECRET` (server only)
   - `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (`test_…` in sandbox, `live_…` in live)
   - `NEXT_PUBLIC_PADDLE_ENV` (`sandbox` | `production`). Required: the app refuses to start if it's unset.
   - `NEXT_PUBLIC_PADDLE_PRICE_MONTHLY`
   - `NEXT_PUBLIC_PADDLE_PRICE_YEARLY`
3. **Install** `@paddle/paddle-js` and `@paddle/paddle-node-sdk`.

**Status (2026-11-27):** sandbox product `pro_01m8fm16879crr1kda08p56nfq`, prices monthly `pri_01m8fm1f6ayt8pmzvkvjqbh2hw` and yearly `pri_01m8fm1g20v9r74rh2cq6e66vm`. SDKs installed; env vars documented in `.env.example`.

## Phase 4: Checkout

1. **Upgrade card in the dashboard.** Monthly/yearly toggle; prices shown in the visitor's local currency by Paddle (`PricePreview`).
2. **Clicking Upgrade opens the Paddle overlay:**
   - The owner's email is prefilled.
   - The owner's profile id is attached as `customData.ownerId`, so the webhook knows which account paid.
   - After paying, the owner lands on `/dashboard?upgraded=1`, which waits for the webhook to confirm before showing Pro.
3. **Replace "Request upgrade"** (sidebar, items page, analytics upsell) with this checkout. The admin page keeps Activate/Downgrade as a manual fallback.

## Phase 5: Webhooks (what actually turns Pro on and off)

1. **New endpoint `app/api/paddle/webhook/route.ts`:**
   - Checks Paddle's signature against the raw request body.
   - Skips events already recorded in `paddle_webhook_events`.
   - Replies 200 once an event is saved, so Paddle doesn't keep resending it.
2. **Events handled:**
   - `subscription.created`, `.activated`, `.updated`, `.canceled`, `.past_due`
   - `transaction.completed`
   - `customer.created`
3. **Each event updates the owner's profile.** The owner is found by `customData.ownerId` or by the stored `paddle_customer_id`.
   - A `comp` profile is never changed.
   - Event times are compared, so an older event that arrives late can't overwrite newer data.
4. **Clear cached pages** (`revalidatePath`) for the dashboard and the owner's public catalog after each update, so the badge and Pro features change straight away.

## Phase 6: Self-service billing

1. **Settings → Billing card:** plan, renewal or end date, and "Cancels on X" when applicable.
2. **"Manage billing" button:** a server action creates a Paddle customer portal session (auth plus ownership check) and opens it. The portal covers card changes, canceling, monthly/yearly switches and invoices.
3. **Dashboard banners:**
   - "Payment failed — update your card" while Paddle is retrying a payment.
   - "Pro ends on X" after a cancel.
   - These replace the current manual expiry countdown.

**Status (2026-11-27), Phases 4–6 built:** `components/billing/*` (provider, UpgradeButton with fallback to the manual request flow when Paddle env is missing, success notice, Billing card, Manage billing), `lib/paddle/{server,sync}.ts`, `app/api/paddle/webhook`, `app/dashboard/settings/billing-actions.ts`. Local signed-webhook test passed (valid → 200, duplicate skipped, bad signature → 500).

## Phase 7: Testing in sandbox (`dev` branch Vercel preview)

1. **Use test card `4242 4242 4242 4242`** (CVC `100`, any future expiry) to run each scenario:
   - Subscribe monthly, and subscribe yearly.
   - Cancel and check Pro stays until the period ends.
   - Make a payment fail with a declined card, then cancel for non-payment.
   - Switch between monthly and yearly in the portal.
   - Confirm comp accounts stay untouched.
2. **Webhook simulator:** send the same event twice and check it's only handled once.
3. **Run `scripts/test-rls.mjs`** (extended) to confirm `app_owner` still can't read or change billing columns.
4. **Run** `npm run build` and `npm run lint`.

## Phase 8: Going live

1. **Once Paddle has verified the account and approved the domain:**
   - Recreate the product and prices in the live account (record sandbox → live ID mapping).
   - Create a live API key, a live client token (`live_…`) and a live webhook destination.
   - Set the default payment link to `https://cataloo.app/dashboard`.
2. **Add the live env vars in Vercel**, then merge `dev` into `master`.
3. **Make one real $10 purchase** to test the whole flow, then refund it.
4. **Ian:** add the payout bank account, and review dunning (failed-payment retry) settings in Paddle Retain.

---

## What Ian needs to provide, and when

| Item | Needed by |
|---|---|
| support@cataloo.app forwarding (registrar or Cloudflare Email Routing) | Phase 1 deploy |
| Paddle live account signup (ID details, home address, website) + `cataloo.app` submitted for approval | After Phase 1 ships |
| Paddle sandbox account, API key, client-side token; fix the Paddle sandbox plugin token (currently rejected with HTTP 401) | Phase 3 |
| Webhook secret: a sandbox notification destination pointing at the preview's `/api/paddle/webhook` (or Claude creates it through the Paddle tools) | Phase 5 |
| Vercel env vars, live verification, payout bank details | Phase 8 |

> The legal pages are solid templates, not legal advice. Have a lawyer review them when possible.
