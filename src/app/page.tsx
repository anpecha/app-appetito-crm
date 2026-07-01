'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  LayoutDashboard,
  Send,
  Workflow,
  Bot,
  Globe,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  ChevronRight,
} from 'lucide-react'

const FEATURE_KEYS = [
  { icon: MessageSquare, key: 'inbox' },
  { icon: LayoutDashboard, key: 'pipeline' },
  { icon: Send, key: 'broadcasts' },
  { icon: Workflow, key: 'automation' },
  { icon: Bot, key: 'ai' },
  { icon: Globe, key: 'api' },
] as const

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const

const STATS = [
  { value: '98%', labelKey: 'statSatisfaction' },
  { value: '14d', labelKey: 'statTrial' },
  { value: '5', labelKey: 'statThemes' },
]

export default function HomePage() {
  const t = useTranslations('landing')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <MessageSquare className="size-5 text-primary" />
            wacrm
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.features')}
            </Link>
            <Link href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.howItWorks')}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">{t('nav.login')}</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                {t('nav.signup')}
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--primary)_0%,_transparent_60%)] opacity-15" />
          <div className="mx-auto max-w-6xl px-4 pb-24 pt-20 md:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 px-4 py-1.5 text-primary">
                <Sparkles className="mr-1.5 size-3.5" />
                {t('hero.badge')}
              </Badge>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                {t('hero.titleStart')}{' '}
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>{' '}
                {t('hero.titleEnd')}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">{t('hero.subtitle')}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="h-11 gap-2 px-6 text-base">
                    {t('hero.ctaStart')}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-11 gap-2 px-6 text-base">
                    {t('hero.ctaFeatures')}
                    <ChevronRight className="size-4" />
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex items-center justify-center gap-10 md:gap-16">
                {STATS.map((stat) => (
                  <div key={stat.labelKey} className="text-center">
                    <div className="text-2xl font-bold text-foreground md:text-3xl">{stat.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{t(`features.${stat.labelKey}`)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
                {t('features.badge')}
              </Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t('features.title')}</h2>
              <p className="mt-4 text-muted-foreground">{t('features.subtitle')}</p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_KEYS.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-[0_0_20px_-8px_var(--primary)]"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{t(`features.${key}Title` as any)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(`features.${key}Desc` as any)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-b border-border py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
                {t('how.badge')}
              </Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t('how.title')}</h2>
              <p className="mt-4 text-muted-foreground">{t('how.subtitle')}</p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-4">
              {STEP_KEYS.map((step, i) => (
                <div key={step} className="relative text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{t(`how.${step}Title` as any)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`how.${step}Desc` as any)}</p>
                  {i < STEP_KEYS.length - 1 && (
                    <div className="absolute left-[60%] top-6 hidden text-muted-foreground/30 md:block">
                      <ArrowRight className="size-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-background px-6 py-16 text-center md:px-16">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary)_0%,_transparent_70%)] opacity-10" />
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
                <Zap className="mr-1.5 size-3.5" />
                {t('cta.badge')}
              </Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t('cta.title')}</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t('cta.subtitle')}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="h-11 gap-2 px-6 text-base">
                    {t('cta.button')}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-11 gap-2 px-6 text-base">
                    {t('cta.alreadyAccount')}
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" /> {t('cta.commitment')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" /> {t('cta.support')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" /> {t('cta.cancel')}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="size-4 text-primary" />
            <span className="font-medium text-foreground">wacrm</span>
            <span className="hidden md:inline">&mdash; {t('footer.tagline')}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">{t('footer.login')}</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">{t('footer.signup')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
