-- Create table to persist Stripe checkout sessions and related info
CREATE TABLE IF NOT EXISTS public.stripe_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid NULL,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  mode text NOT NULL DEFAULT 'payment',
  amount numeric NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'created',
  raw_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to update updated_at on update
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_timestamp_on_stripe_sessions ON public.stripe_sessions;
CREATE TRIGGER set_timestamp_on_stripe_sessions
BEFORE UPDATE ON public.stripe_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_user_id ON public.stripe_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_stripe_session_id ON public.stripe_sessions(stripe_session_id);

-- Ensure processed_webhook_events has received_at column for idempotency tracking
ALTER TABLE public.processed_webhook_events
  ADD COLUMN IF NOT EXISTS received_at timestamptz DEFAULT now();

-- Minimal grants (service_role will always have full access; grant to authenticated for convenience)
GRANT SELECT, INSERT, UPDATE ON public.stripe_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stripe_sessions TO service_role;
