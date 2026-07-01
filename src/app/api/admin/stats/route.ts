import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { data: trialUsers },
    { count: totalContacts },
    { data: mrr },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('subscriptions').select('user_id').eq('status', 'trial'),
    supabaseAdmin.from('contacts').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('plans').select('slug, price_cents').eq('active', true),
  ])

  const planBreakdown = await supabaseAdmin
    .from('subscriptions')
    .select('status, plan:plans(slug, name)')

  const mrrTotal = (mrr || []).reduce((acc, p) => {
    const count = planBreakdown.data?.filter(
      (s: any) => s.status === 'active' && s.plan?.slug === p.slug
    ).length || 0
    return acc + (p.price_cents * count) / 100
  }, 0)

  return NextResponse.json({
    totalUsers,
    activeSubscriptions,
    trialUsers: trialUsers?.length || 0,
    totalContacts,
    mrrTotal,
    mrrCurrency: 'BRL',
    planBreakdown: planBreakdown.data,
  })
}
