'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface UserData {
  id: string
  user_id: string
  full_name: string
  email: string
  role: string
  created_at: string
  subscription: {
    id: string
    plan_id: string
    status: string
    plan: { id: string; slug: string; name: string }
    trial_end: string
  } | null
}

export default function AdminUsersPage() {
  const t = useTranslations('admin')
  const [users, setUsers] = useState<UserData[]>([])
  const [plans, setPlans] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/billing/plans').then((r) => r.json()),
    ])
      .then(([userData, planData]) => {
        setUsers(userData.users || [])
        setPlans(planData.plans || [])
      })
      .catch(() => toast.error(t('loadError')))
      .finally(() => setLoading(false))
  }, [t])

  async function handlePlanChange(userId: string, planId: string) {
    const r = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId }),
    })
    if (r.ok) toast.success(t('updated'))
    else toast.error(t('updateError'))
  }

  async function handleStatusChange(userId: string, status: string) {
    const r = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (r.ok) toast.success(t('updated'))
    else toast.error(t('updateError'))
  }

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('manageUsers')}</h1>
          <p className="text-sm text-muted-foreground">{users.length} {t('usersTotal')}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('allUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">{t('userName')}</th>
                  <th className="pb-3 font-medium">{t('email')}</th>
                  <th className="pb-3 font-medium">{t('plan')}</th>
                  <th className="pb-3 font-medium">{t('status')}</th>
                  <th className="pb-3 font-medium">{t('role')}</th>
                  <th className="pb-3 font-medium">{t('createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 font-medium">{u.full_name || '—'}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3">
                      <Select
                        defaultValue={u.subscription?.plan?.id || ''}
                        onValueChange={(v) => v && handlePlanChange(u.user_id as string, v)}
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3">
                      <Select
                        defaultValue={u.subscription?.status || 'trial'}
                        onValueChange={(v) => v && handleStatusChange(u.user_id as string, v)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['trial', 'active', 'past_due', 'canceled', 'expired'].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
