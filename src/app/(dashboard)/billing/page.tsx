'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, AlertCircle, CreditCard, ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Subscription, Quotas } from '@/types/billing'

export default function BillingPage() {
  const t = useTranslations('billing')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [quotas, setQuotas] = useState<Quotas | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/billing/subscription').then((r) => r.json()),
      fetch('/api/billing/quotas').then((r) => r.json()),
    ])
      .then(([subData, quotaData]) => {
        setSubscription(subData.subscription || null)
        setQuotas(quotaData.quotas || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const r = await fetch('/api/billing/portal', { method: 'POST' })
      const d = await r.json()
      if (d.url) window.location.href = d.url
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'trial': return 'secondary'
      case 'past_due': return 'destructive'
      default: return 'outline'
    }
  }

  const planName = subscription?.plan?.name || 'Free'
  const statusLabel = subscription?.status || 'active'
  const trialEnd = subscription?.trial_end

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('currentPlan')}</span>
              <Badge variant={statusVariant(statusLabel)} className="capitalize">
                {statusLabel === 'trial' ? t('trial') : statusLabel}
              </Badge>
            </CardTitle>
            <CardDescription>{t('yourPlanIs')} <strong>{planName}</strong></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusLabel === 'trial' && trialEnd && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">{t('trialEnding')}</p>
                    <p className="mt-1">
                      {t('yourTrialEnds')} {new Date(trialEnd).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {statusLabel === 'past_due' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">{t('paymentFailed')}</p>
                    <p className="mt-1">{t('paymentFailedDesc')}</p>
                  </div>
                </div>
              </div>
            )}
            {statusLabel === 'active' && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="size-4" />
                <span>{t('activePlan')}</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handlePortal}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              {t('manageSubscription')}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('usage')}</CardTitle>
            <CardDescription>{t('usageDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotas ? (
              <>
                <UsageBar
                  label={t('contacts')}
                  used={quotas.contacts.used}
                  limit={quotas.contacts.limit}
                  unit={t('units')}
                />
                <UsageBar
                  label={t('broadcasts')}
                  used={quotas.broadcasts.used}
                  limit={quotas.broadcasts.limit}
                  unit={t('units')}
                />
                <UsageBar
                  label={t('messages')}
                  used={quotas.messages.used}
                  limit={quotas.messages.limit}
                  unit={t('units')}
                />
                <UsageBar
                  label={t('automations')}
                  used={quotas.automations.used}
                  limit={quotas.automations.limit}
                  unit={t('units')}
                />
                <UsageBar
                  label={t('flows')}
                  used={quotas.flows.used}
                  limit={quotas.flows.limit}
                  unit={t('units')}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noQuotas')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('upgradeTitle')}</CardTitle>
          <CardDescription>{t('upgradeDescription')}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/pricing">
            <Button className="gap-2">
              {t('viewPlans')}
              <ExternalLink className="size-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

function UsageBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string
  used: number
  limit: number
  unit: string
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 100
  const variant = pct >= 90 ? 'destructive' : pct >= 70 ? 'warning' : 'default'

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used}{unit} / {limit === Infinity ? '∞' : limit}{unit}
        </span>
      </div>
      <Progress
        value={pct}
        className={variant === 'destructive' ? '[&>div]:bg-destructive' : variant === 'warning' ? '[&>div]:bg-amber-500' : ''}
      />
    </div>
  )
}
