import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
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
  gymAddress: z.string().optional().default(''),
  gymPhone: z.string().optional().default(''),
  gymEmail: z.string().optional().default(''),
  logoBase64: z.string().optional().default(''),
  taxRate: z.string().optional().default('0.00'),
  currencySymbol: z.string().optional().default('$'),
  currencyCode: z.string().optional().default('ARS'),
  decimalPlaces: z.coerce.number().int().min(0).max(10).optional().default(2),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  membershipReminderDays: z.coerce.number().int().min(0).optional().default(7),
  checkInWindowMinutes: z.coerce.number().int().min(0).optional().default(60),
  enableAutoRenew: z.boolean().optional().default(false),
  openingTime: z.string().optional().default('08:00'),
  closingTime: z.string().optional().default('22:00'),
  mondayOpen: z.boolean().optional().default(true),
  tuesdayOpen: z.boolean().optional().default(true),
  wednesdayOpen: z.boolean().optional().default(true),
  thursdayOpen: z.boolean().optional().default(true),
  fridayOpen: z.boolean().optional().default(true),
  saturdayOpen: z.boolean().optional().default(false),
  sundayOpen: z.boolean().optional().default(false),
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
