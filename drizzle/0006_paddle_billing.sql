-- Paddle billing: subscription mirror on profiles + webhook idempotency log.
--
-- `profiles.plan` stays the single feature gate (lib/plans.ts isPro). The
-- Paddle webhook (app/api/paddle/webhook) is the only writer of the columns
-- below and of `plan` for paddle-sourced Pro; it runs on the postgres
-- connection. app_owner already has table-level SELECT on profiles (owners
-- can read their own billing state for the Billing card) but its UPDATE grant
-- is column-level (0005), so none of these columns are owner-writable.

-- ── profiles: subscription mirror ──────────────────────────────────────────
ALTER TABLE public.profiles
  -- Where Pro comes from: 'paddle' (paid subscription), 'comp' (granted free
  -- forever; webhooks never change it) or NULL (Free, or legacy manual grant).
  ADD COLUMN IF NOT EXISTS pro_source text
    CHECK (pro_source IN ('paddle', 'comp')),
  ADD COLUMN IF NOT EXISTS paddle_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text UNIQUE,
  -- Raw Paddle subscription status: active | trialing | past_due | paused | canceled.
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS subscription_price_id text,
  -- 'month' | 'year', from the price's billing cycle.
  ADD COLUMN IF NOT EXISTS billing_interval text
    CHECK (billing_interval IN ('month', 'year')),
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  -- True while a cancellation is scheduled for the end of the period.
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  -- Paddle `occurred_at` of the last applied subscription event. Webhooks can
  -- arrive out of order; older events than this are ignored.
  ADD COLUMN IF NOT EXISTS subscription_synced_at timestamptz;

-- ── Webhook idempotency log (server-only) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paddle_webhook_events (
  event_id     text PRIMARY KEY,
  event_type   text NOT NULL,
  occurred_at  timestamptz NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Deny-all for the Data API; no app_owner grants or policies — only the
-- webhook (postgres) touches this table.
ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paddle_webhook_events FROM anon, authenticated;

-- ── Grandfathered Pro (decided 2026-11-26) ─────────────────────────────────
-- Free Pro forever: mark as comp and clear the manual-term countdown.
UPDATE public.profiles
   SET pro_source = 'comp', plan = 'pro', pro_expires_at = NULL, updated_at = now()
 WHERE handle IN ('abijaoudi-supermarket', 'sample-store');
