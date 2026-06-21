-- Subscription tier + Pro logo. Existing rows default to the Free plan, which
-- grandfathers everyone (and keeps their already-chosen handles intact).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS logo_url text;
