'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Building2, Users, MessageSquare, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { TenantSettings } from '@/types/billing'

type Step = 'company' | 'team' | 'whatsapp' | 'done'

const steps: Step[] = ['company', 'team', 'whatsapp', 'done']

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('company')
  const [saving, setSaving] = useState(false)

  // Company info
  const [companyName, setCompanyName] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [industry, setIndustry] = useState('')
  const [goal, setGoal] = useState('')

  useEffect(() => {
    fetch('/api/onboarding')
      .then((r) => r.json())
      .then((d) => {
        if (d.onboarding_completed) {
          router.push('/dashboard')
          return
        }
        setSettings(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  async function saveStep(data: Record<string, unknown>) {
    setSaving(true)
    try {
      const r = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!r.ok) throw new Error()
    } catch {
      toast.error(t('error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleCompanyNext() {
    if (!companyName.trim()) return toast.error(t('requiredCompany'))
    await saveStep({
      company_name: companyName,
      company_size: companySize || null,
      industry: industry || null,
      goal: goal || null,
    })
    setStep('team')
  }

  async function handleTeamNext() {
    setStep('whatsapp')
  }

  async function handleWhatsappNext() {
    setStep('done')
  }

  async function handleComplete() {
    setSaving(true)
    try {
      const r = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true, onboarding_step: 'done' }),
      })
      if (r.ok) {
        toast.success(t('completed'))
        router.push('/dashboard')
      }
    } finally {
      setSaving(false)
    }
  }

  const stepIndex = steps.indexOf(step)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {step === 'company' && <Building2 className="size-6 text-primary" />}
            {step === 'team' && <Users className="size-6 text-primary" />}
            {step === 'whatsapp' && <MessageSquare className="size-6 text-primary" />}
            {step === 'done' && <CheckCircle className="size-6 text-primary" />}
          </div>
          <CardTitle className="text-2xl">
            {step === 'company' && t('companyTitle')}
            {step === 'team' && t('teamTitle')}
            {step === 'whatsapp' && t('whatsappTitle')}
            {step === 'done' && t('doneTitle')}
          </CardTitle>
          <CardDescription>
            {step === 'company' && t('companySubtitle')}
            {step === 'team' && t('teamSubtitle')}
            {step === 'whatsapp' && t('whatsappSubtitle')}
            {step === 'done' && t('doneSubtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      i <= stepIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {step === 'company' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">{t('companyName')}</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('companyNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="companySize">{t('companySize')}</Label>
                <Input
                  id="companySize"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  placeholder={t('companySizePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="industry">{t('industry')}</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder={t('industryPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="goal">{t('goal')}</Label>
                <Textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t('goalPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 'team' && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">{t('teamDescription')}</p>
              <div className="rounded-lg border border-border p-4">
                <Users className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">{t('singleUser')}</p>
                <p className="text-xs text-muted-foreground">{t('singleUserDesc')}</p>
              </div>
            </div>
          )}

          {step === 'whatsapp' && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">{t('whatsappDescription')}</p>
              <div className="rounded-lg border border-border p-4">
                <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">{t('connectLater')}</p>
                <p className="text-xs text-muted-foreground">{t('connectLaterDesc')}</p>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <CheckCircle className="mx-auto size-16 text-primary" />
              <p className="text-lg font-medium">{t('allSet')}</p>
              <p className="text-muted-foreground">{t('allSetDesc')}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between">
          {stepIndex > 0 && step !== 'done' && (
            <Button
              variant="outline"
              onClick={() => setStep(steps[stepIndex - 1])}
              disabled={saving}
            >
              {t('back')}
            </Button>
          )}
          {(stepIndex === 0 || stepIndex === 0) && step !== 'done' && (
            <Button
              className="ml-auto"
              onClick={handleCompanyNext}
              disabled={saving || !companyName.trim()}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : t('next')}
            </Button>
          )}
          {step === 'team' && (
            <Button className="ml-auto" onClick={handleTeamNext}>
              {t('next')}
            </Button>
          )}
          {step === 'whatsapp' && (
            <Button className="ml-auto" onClick={handleWhatsappNext}>
              {t('next')}
            </Button>
          )}
          {step === 'done' && (
            <Button className="ml-auto" onClick={handleComplete} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : t('finish')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
