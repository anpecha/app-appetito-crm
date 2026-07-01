import Stripe from 'stripe'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, {
    apiVersion: '2026-06-24.dahlia',
    typescript: true,
  })
}

export const stripe = getStripe()
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export function getStripeCustomerEmail(customer: Stripe.Customer | Stripe.DeletedCustomer): string | null {
  if (customer.deleted) return null
  return customer.email
}
