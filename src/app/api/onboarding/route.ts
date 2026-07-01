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

  // Auto-initialize user data if DB triggers failed on signup.
  // Check & create subscription (fallback for broken trigger).
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub) {
    const { data: freePlan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (freePlan) {
      await supabaseAdmin.from('subscriptions').insert({
        user_id: user.id,
        plan_id: freePlan.id,
        status: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 86400000).toISOString(),
      })
    }
  }

  // Check & create tenant_settings (fallback for broken trigger).
  const { data: settings } = await supabaseAdmin
    .from('tenant_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!settings) {
    const { data: newSettings } = await supabaseAdmin
      .from('tenant_settings')
      .insert({ user_id: user.id })
      .select()
      .single()

    return NextResponse.json({ settings: newSettings })
  }

  return NextResponse.json({ settings })
}

export async function PATCH(req: Request) {
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

  const body = await req.json()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabaseAdmin
    .from('tenant_settings')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
