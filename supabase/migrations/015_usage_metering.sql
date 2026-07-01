CREATE TABLE usage_metering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, metric_name, period_start)
);

ALTER TABLE usage_metering ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_metering FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all"
  ON usage_metering FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_usage_metering_user ON usage_metering(user_id);
CREATE INDEX idx_usage_metering_period ON usage_metering(period_start, period_end);

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_metric_name TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS void
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  v_period_start := DATE_TRUNC('month', NOW());
  v_period_end := v_period_start + INTERVAL '1 month';

  INSERT INTO usage_metering (user_id, metric_name, metric_value, period_start, period_end)
  VALUES (p_user_id, p_metric_name, p_increment, v_period_start, v_period_end)
  ON CONFLICT (user_id, metric_name, period_start)
  DO UPDATE SET metric_value = usage_metering.metric_value + p_increment,
               updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_remaining_quota(
  p_user_id UUID,
  p_metric_name TEXT
)
RETURNS BIGINT
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_used BIGINT;
  v_limit BIGINT;
  v_plan_slug TEXT;
  v_plan_limits JSONB;
BEGIN
  SELECT metric_value INTO v_used
  FROM usage_metering
  WHERE user_id = p_user_id
    AND metric_name = p_metric_name
    AND period_start = DATE_TRUNC('month', NOW());

  SELECT p.slug, p.limits INTO v_plan_slug, v_plan_limits
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('trial', 'active');

  v_limit := COALESCE((v_plan_limits->>p_metric_name)::BIGINT, 0);

  IF v_limit = -1 THEN
    RETURN 999999999;
  END IF;

  RETURN GREATEST(v_limit - COALESCE(v_used, 0), 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_quota(
  p_user_id UUID,
  p_metric_name TEXT,
  p_required BIGINT DEFAULT 1
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_remaining BIGINT;
BEGIN
  v_remaining := get_remaining_quota(p_user_id, p_metric_name);
  RETURN v_remaining >= p_required;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_quotas(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan_slug TEXT;
  v_plan_limits JSONB;
  v_quotas JSONB;
  v_metric TEXT;
  v_used BIGINT;
  v_limit BIGINT;
  v_remaining BIGINT;
BEGIN
  SELECT p.slug, p.limits INTO v_plan_slug, v_plan_limits
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('trial', 'active');

  v_quotas := '{}'::JSONB;

  FOR v_metric IN SELECT jsonb_object_keys(v_plan_limits)
  LOOP
    v_limit := COALESCE((v_plan_limits->>v_metric)::BIGINT, 0);

    SELECT metric_value INTO v_used
    FROM usage_metering
    WHERE user_id = p_user_id
      AND metric_name = v_metric
      AND period_start = DATE_TRUNC('month', NOW());

    v_used := COALESCE(v_used, 0);

    IF v_limit = -1 THEN
      v_remaining := 999999999;
    ELSE
      v_remaining := GREATEST(v_limit - v_used, 0);
    END IF;

    v_quotas := jsonb_set(v_quotas, ARRAY[v_metric], jsonb_build_object(
      'limit', v_limit,
      'used', v_used,
      'remaining', v_remaining
    ));
  END LOOP;

  RETURN v_quotas;
END;
$$ LANGUAGE plpgsql;
