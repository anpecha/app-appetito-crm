CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plans (slug, name, description, price_cents, stripe_price_id, features, limits, sort_order) VALUES
('free', 'Free', 'Para começar', 0, NULL,
  '["Até 50 contatos", "500 mensagens/mês", "1 pipeline", "1 usuário", "Suporte por email"]',
  '{"max_contacts": 50, "max_messages_monthly": 500, "max_pipelines": 1, "max_members": 1, "max_broadcasts_monthly": 5, "max_automations": 3, "max_flows": 1, "storage_mb": 50}',
  0);
INSERT INTO plans (slug, name, description, price_cents, stripe_price_id, features, limits, sort_order) VALUES
('pro', 'Pro', 'Para profissionais', 9700, NULL,
  '["Até 500 contatos", "5.000 mensagens/mês", "3 pipelines", "2 usuários", "Suporte por chat", "Automações ilimitadas", "Templates de broadcast"]',
  '{"max_contacts": 500, "max_messages_monthly": 5000, "max_pipelines": 3, "max_members": 2, "max_broadcasts_monthly": 50, "max_automations": -1, "max_flows": 5, "storage_mb": 500}',
  1);
INSERT INTO plans (slug, name, description, price_cents, stripe_price_id, features, limits, sort_order) VALUES
('business', 'Business', 'Para equipes', 29700, NULL,
  '["Até 2.000 contatos", "Mensagens ilimitadas", "Pipelines ilimitados", "5 usuários", "Suporte prioritário", "Fluxos de IA ilimitados", "API + Webhooks"]',
  '{"max_contacts": 2000, "max_messages_monthly": -1, "max_pipelines": -1, "max_members": 5, "max_broadcasts_monthly": -1, "max_automations": -1, "max_flows": -1, "storage_mb": 2000}',
  2);
INSERT INTO plans (slug, name, description, price_cents, stripe_price_id, features, limits, sort_order) VALUES
('enterprise', 'Enterprise', 'Para empresas', 99700, NULL,
  '["Contatos ilimitados", "Mensagens ilimitadas", "Pipelines ilimitados", "Usuários ilimitados", "Suporte dedicado", "Automações customizadas", "SLA garantido"]',
  '{"max_contacts": -1, "max_messages_monthly": -1, "max_pipelines": -1, "max_members": -1, "max_broadcasts_monthly": -1, "max_automations": -1, "max_flows": -1, "storage_mb": -1}',
  3);

CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'expired', 'incomplete');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  INSERT INTO public.subscriptions (user_id, plan_id, status, trial_start, trial_end)
  VALUES (NEW.id, v_free_plan_id, 'trial', NOW(), NOW() + INTERVAL '14 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();

CREATE OR REPLACE FUNCTION expire_trial_subscriptions()
RETURNS void
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'trial'
    AND trial_end < NOW();
END;
$$ LANGUAGE plpgsql;
