import { NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const buf = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { data: plans } = await supabaseAdmin.from('plans').select('*')

  async function getPlanByPriceId(priceId: string) {
    return plans?.find((p) => p.stripe_price_id === priceId) || null
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const email = session.customer_email || session.customer_details?.email
        const priceId = (session as any).line_items?.data?.[0]?.price?.id

        const { data: existingUser } = email
          ? await supabaseAdmin.from('profiles').select('user_id').eq('email', email).single()
          : { data: null }

        if (existingUser?.user_id) {
          const plan = priceId ? await getPlanByPriceId(priceId) : null
          if (plan) {
            await supabaseAdmin.from('subscriptions').update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_id: plan.id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('user_id', existingUser.user_id)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub: any = event.data.object
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price?.id
        const plan = priceId ? await getPlanByPriceId(priceId) : null

        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'canceled',
          incomplete: 'incomplete',
          trialing: 'trial',
          unpaid: 'past_due',
        }

        await supabaseAdmin.from('subscriptions').update({
          plan_id: plan?.id ?? undefined,
          status: statusMap[sub.status] || 'active',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const deleted: any = event.data.object
        const freePlan = plans?.find((p) => p.slug === 'free')
        if (freePlan) {
          await supabaseAdmin.from('subscriptions').update({
            plan_id: freePlan.id,
            status: 'expired',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', deleted.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice: any = event.data.object
        const subscriptionId = invoice.subscription as string
        await supabaseAdmin.from('subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscriptionId)
        break
      }
    }
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
