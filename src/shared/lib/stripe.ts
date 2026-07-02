import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY no está configurada. Configurala en las variables de entorno.',
    )
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: '2025-04-15',
  })
  return _stripe
}

export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY ?? ''
}

export function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? ''
}
