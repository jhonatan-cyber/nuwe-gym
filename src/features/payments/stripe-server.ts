import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and, ne } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { memberPaymentMethods } from '#/shared/db/schema/member-payment-methods.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { getStripeClient } from '#/shared/lib/stripe.ts'
import { uuidField } from '#/shared/lib/schemas.ts'

// ── Create Setup Intent (to securely collect card details on frontend) ──

export const createSetupIntent = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ memberId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'payments:write' } })

    const stripe = getStripeClient()
    const settingsRows = await db.select().from(settings).limit(1)
    const publishableKey = settingsRows[0]?.stripePublishableKey ?? ''
    if (!publishableKey) {
      throw new Error('Stripe no está configurado. Configurá la clave publicable en Settings > Pagos.')
    }

    // Find or create Stripe customer for this member
    const existingMethods = await db.query.memberPaymentMethods.findFirst({
      where: eq(memberPaymentMethods.memberId, data.memberId),
    })

    let customerId = existingMethods?.stripeCustomerId ?? ''

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { memberId: data.memberId },
      })
      customerId = customer.id
    }

    const intent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    })

    return {
      clientSecret: intent.client_secret,
      customerId,
      publishableKey,
    }
  })

// ── Attach Payment Method (after successful setup) ──

const attachPaymentMethodSchema = z.object({
  memberId: uuidField,
  stripePaymentMethodId: z.string().min(1),
  stripeCustomerId: z.string().min(1),
  cardBrand: z.string().default(''),
  cardLast4: z.string().default(''),
  cardExpMonth: z.string().default(''),
  cardExpYear: z.string().default(''),
})

export const attachPaymentMethod = createServerFn({ method: 'POST' })
  .validator((data) => attachPaymentMethodSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'payments:write' } })

    const stripe = getStripeClient()

    // Attach payment method to customer
    await stripe.paymentMethods.attach(data.stripePaymentMethodId, {
      customer: data.stripeCustomerId,
    })

    // Save to our DB
    const [pm] = await db
      .insert(memberPaymentMethods)
      .values({
        memberId: data.memberId,
        stripeCustomerId: data.stripeCustomerId,
        stripePaymentMethodId: data.stripePaymentMethodId,
        cardBrand: data.cardBrand,
        cardLast4: data.cardLast4,
        cardExpMonth: data.cardExpMonth,
        cardExpYear: data.cardExpYear,
        isDefault: true,
      })
      .returning()

    // Mark all OTHER payment methods for this member as non-default
    await db
      .update(memberPaymentMethods)
      .set({ isDefault: false })
      .where(
        and(
          eq(memberPaymentMethods.memberId, data.memberId),
          eq(memberPaymentMethods.isDefault, true),
          ne(memberPaymentMethods.id, pm.id),
        ),
      )

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PAYMENT_METHOD',
      entityId: pm.id,
      description: `Registró tarjeta ${data.cardBrand} ****${data.cardLast4} para socio #${data.memberId}`,
    })

    return pm
  })

// ── List Payment Methods for a member ──

export const getMemberPaymentMethods = createServerFn({ method: 'GET' })
  .validator((data) => z.object({ memberId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'payments:read' } })

    const methods = await db.query.memberPaymentMethods.findMany({
      where: eq(memberPaymentMethods.memberId, data.memberId),
      orderBy: (pm, { desc }) => [desc(pm.isDefault), desc(pm.createdAt)],
    })

    return methods
  })

// ── Toggle Auto-Pay for a payment method ──

const toggleAutoPaySchema = z.object({
  id: uuidField,
  autoPay: z.boolean(),
})

export const toggleAutoPay = createServerFn({ method: 'POST' })
  .validator((data) => toggleAutoPaySchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'payments:write' } })

    const [pm] = await db
      .update(memberPaymentMethods)
      .set({ autoPay: data.autoPay, updatedAt: new Date() })
      .where(eq(memberPaymentMethods.id, data.id))
      .returning()

    return pm
  })

// ── Detach Payment Method ──

export const removePaymentMethod = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'payments:write' } })

    const pm = await db.query.memberPaymentMethods.findFirst({
      where: eq(memberPaymentMethods.id, data.id),
    })
    if (!pm) throw new Error('Método de pago no encontrado')

    // Detach from Stripe
    try {
      const stripe = getStripeClient()
      await stripe.paymentMethods.detach(pm.stripePaymentMethodId)
    } catch {
      // Ignore if already detached
    }

    // Remove from our DB
    await db.delete(memberPaymentMethods).where(eq(memberPaymentMethods.id, data.id))

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'PAYMENT_METHOD',
      entityId: data.id,
      description: `Eliminó tarjeta ${pm.cardBrand} ****${pm.cardLast4}`,
    })

    return { success: true }
  })

// ── Charge a saved payment method (used by auto-renewals) ──

export async function chargePaymentMethod(
  memberId: string,
  amount: string,
  description: string,
): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
  const settingsRows = await db.select().from(settings).limit(1)
  if (!settingsRows[0]?.stripeSecretKey) {
    return { success: false, error: 'Stripe no configurado' }
  }

  const pm = await db.query.memberPaymentMethods.findFirst({
    where: and(
      eq(memberPaymentMethods.memberId, memberId),
      eq(memberPaymentMethods.autoPay, true),
    ),
  })

  if (!pm || !pm.stripeCustomerId) {
    return { success: false, error: 'El socio no tiene un método de pago con auto-pago activado' }
  }

  try {
    const stripe = getStripeClient()
    const amountInCents = Math.round(Number.parseFloat(amount) * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: pm.stripeCustomerId,
      payment_method: pm.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description,
      metadata: { memberId },
    })

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntentId: paymentIntent.id,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? 'Error al procesar el pago',
    }
  }
}
