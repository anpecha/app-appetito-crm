export interface Plan {
  id: string
  stripe_price_id: string | null
  name: string
  slug: string
  description: string | null
  price_cents: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: Record<string, number>
  sort_order: number
  active: boolean
}

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired' | 'incomplete'

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string
  trial_end: string
  canceled_at: string | null
  plan?: Plan
}

export interface UsageMetering {
  id: string
  user_id: string
  metric_name: string
  metric_value: number
  period_start: string
  period_end: string
}

export interface QuotaInfo {
  limit: number
  used: number
  remaining: number
}

export interface Quotas {
  [metric: string]: QuotaInfo
}

export interface TenantSettings {
  id: string
  user_id: string
  onboarding_completed: boolean
  onboarding_step: number
  company_name: string | null
  company_size: string | null
  whatsapp_connected: boolean
  first_contact_added: boolean
  metadata: Record<string, unknown>
}
