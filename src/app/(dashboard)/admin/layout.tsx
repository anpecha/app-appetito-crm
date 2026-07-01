'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function check() {
      try {
        const r = await fetch('/api/admin/users')
        if (r.ok) setAuthorized(true)
        else router.push('/dashboard')
      } catch {
        router.push('/dashboard')
      }
    }
    check()
  }, [router])

  if (!authorized) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
