import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { optionalString, timeString } from '#/shared/lib/schemas.ts'
import { db } from '#/shared/db/index.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

export const getSettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const rows = await db.select().from(settings).limit(1)
    return rows[0] ?? null
  },
)

const updateSettingsSchema = z.object({
  gymName: z.string().min(1, 'El nombre del gimnasio es obligatorio'),
  gymAddress: optionalString.default(''),
  gymPhone: optionalString.default(''),
  gymEmail: optionalString.default(''),
  logoBase64: optionalString.default(''),
  taxRate: optionalString.default('0.00'),
  currencySymbol: optionalString.default('$'),
  currencyCode: optionalString.default('ARS'),
  decimalPlaces: z.coerce.number().int().min(0).max(10).optional().default(2),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  membershipReminderDays: z.coerce.number().int().min(0).optional().default(7),
  checkInWindowMinutes: z.coerce.number().int().min(0).optional().default(60),
  enableAutoRenew: z.boolean().optional().default(false),
  resendApiKey: optionalString.default(''),
  emailFrom: optionalString.default(''),
  openingTime: timeString.optional().default('08:00'),
  closingTime: timeString.optional().default('22:00'),
  mondayOpen: z.boolean().optional().default(true),
  tuesdayOpen: z.boolean().optional().default(true),
  wednesdayOpen: z.boolean().optional().default(true),
  thursdayOpen: z.boolean().optional().default(true),
  fridayOpen: z.boolean().optional().default(true),
  saturdayOpen: z.boolean().optional().default(false),
  sundayOpen: z.boolean().optional().default(false),
  // Fiscal data for invoices
  companyTaxId: optionalString.default(''),
  companyLegalName: optionalString.default(''),
  invoiceFooter: optionalString.default(''),
  // Twilio (WhatsApp + SMS)
  twilioAccountSid: optionalString.default(''),
  twilioAuthToken: optionalString.default(''),
  twilioWhatsAppNumber: optionalString.default(''),
  twilioSmsNumber: optionalString.default(''),
  waTemplateExpirationSid: optionalString.default(''),
  waTemplateExpiredSid: optionalString.default(''),
  waTemplateBirthdaySid: optionalString.default(''),
  waTemplateInactiveSid: optionalString.default(''),
  waTemplateClassReminderSid: optionalString.default(''),
  autoRenewSecretKey: optionalString.default(''),
  // Stripe (Cobro automático)
  stripeSecretKey: optionalString.default(''),
  stripePublishableKey: optionalString.default(''),
  stripeWebhookSecret: optionalString.default(''),
  // Firebase Cloud Messaging
  firebaseApiKey: optionalString.default(''),
  firebaseAuthDomain: optionalString.default(''),
  firebaseProjectId: optionalString.default(''),
  firebaseMessagingSenderId: optionalString.default(''),
  firebaseAppId: optionalString.default(''),
  firebaseVapidKey: optionalString.default(''),
  firebaseServiceAccount: optionalString.default(''),
})

export const updateSettings = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateSettingsSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const existing = await db
      .select({ id: settings.id })
      .from(settings)
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(settings.id, existing[0].id))
    } else {
      await db.insert(settings).values(data)
    }

    const rows = await db.select().from(settings).limit(1)

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'SETTING',
      description: 'Actualizó configuración del sistema',
    })

    return rows[0]
  })
