import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/shared/db/index.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { getStripeClient } from '#/shared/lib/stripe.ts'

export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const settingsRows = await db.select().from(settings).limit(1)
          const webhookSecret = settingsRows[0]?.stripeWebhookSecret ?? ''
          if (!webhookSecret) {
            return new Response(
              JSON.stringify({ error: 'Webhook secret no configurado' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const stripe = getStripeClient()
          const body = await request.text()
          const signature = request.headers.get('stripe-signature') ?? ''

          let event
          try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
          } catch {
            return new Response(
              JSON.stringify({ error: 'Firma inválida' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // Handle the event
          switch (event.type) {
            case 'payment_intent.succeeded': {
              const paymentIntent = event.data.object
              console.log(
                `[Stripe Webhook] Pago exitoso: ${paymentIntent.id} - ${paymentIntent.amount} ${paymentIntent.currency}`,
              )
              break
            }
            case 'payment_intent.payment_failed': {
              const failedPayment = event.data.object
              console.error(
                `[Stripe Webhook] Pago fallido: ${failedPayment.id}`,
                failedPayment.last_payment_error?.message ?? '',
              )
              break
            }
            case 'setup_intent.succeeded': {
              const setupIntent = event.data.object
              console.log(
                `[Stripe Webhook] Setup Intent exitoso: ${setupIntent.id}`,
              )
              break
            }
            default:
              console.log(`[Stripe Webhook] Evento no manejado: ${event.type}`)
          }

          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error interno'
          console.error('[Stripe Webhook] Error:', message)
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
