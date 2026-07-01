'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import type { Plan } from '@/types/billing'

export default function PricingPage() {
  const t = useTranslations('pricing')
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/billing/plans')
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCheckout(priceId: string, slug: string) {
    if (!priceId) return
    setCheckoutLoading(slug)
    try {
      const r = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const d = await r.json()
      if (d.url) window.location.href = d.url
    } finally {
      setCheckoutLoading(null)
    }
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-foreground">wacrm</Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">{t('login')}</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{t('signup')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl font-bold md:text-5xl">{t('title')}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => {
                const isFree = plan.price_cents === 0
                const isPopular = plan.slug === 'pro'
                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col ${isPopular ? 'border-primary shadow-[0_0_20px_-8px_var(--primary)]' : ''}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge>{t('popular')}</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">{isFree ? 'Grátis' : formatPrice(plan.price_cents)}</span>
                        {!isFree && <span className="text-sm text-muted-foreground">/{t('month')}</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-3">
                        {(plan.features as string[]).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isFree ? (
                        <Link href="/signup" className="w-full">
                          <Button className="w-full" variant="outline">{t('ctaFree')}</Button>
                        </Link>
                      ) : (
                        <Button
                          className="w-full"
                          disabled={!plan.stripe_price_id || checkoutLoading === plan.slug}
                          onClick={() => handleCheckout(plan.stripe_price_id!, plan.slug)}
                        >
                          {checkoutLoading === plan.slug ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            t('ctaPaid')
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto text-center text-sm text-muted-foreground">
          {t('footer')}
        </div>
      </footer>
    </div>
  )
}
