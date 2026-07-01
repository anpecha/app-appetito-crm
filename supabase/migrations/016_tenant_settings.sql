CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  company_name TEXT,
  company_size TEXT,
  whatsapp_connected BOOLEAN NOT NULL DEFAULT false,
  first_contact_added BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant settings"
  ON tenant_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tenant settings"
  ON tenant_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all"
  ON tenant_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION handle_new_user_tenant_settings()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.tenant_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created_tenant_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_tenant_settings();
