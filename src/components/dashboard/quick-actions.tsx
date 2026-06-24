"use client"

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { UserPlus, Briefcase, Radio, Zap } from 'lucide-react'
import type { ComponentType } from 'react'

interface Action {
  tKey: string
  href: string
  icon: ComponentType<{ className?: string }>
  tint: string
}

const ACTIONS: Action[] = [
  { tKey: 'dashboard.newContact', href: '/contacts', icon: UserPlus, tint: 'text-primary' },
  { tKey: 'dashboard.newDeal', href: '/pipelines', icon: Briefcase, tint: 'text-blue-400' },
  { tKey: 'dashboard.newBroadcast', href: '/broadcasts/new', icon: Radio, tint: 'text-amber-400' },
  { tKey: 'dashboard.newAutomation', href: '/automations/new', icon: Zap, tint: 'text-primary' },
]

export function QuickActions() {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 ${a.tint}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">{t(a.tKey)}</span>
          </Link>
        )
      })}
    </div>
  )
}
