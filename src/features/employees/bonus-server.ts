import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employeeBonuses } from '#/shared/db/schema/employee-bonuses.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { uuidField, optionalString } from '#/shared/lib/schemas.ts'

// ── List all bonuses ──

export const getBonuses = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z.object({ employeeId: optionalString.default('') }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    const conditions = data.employeeId
      ? [eq(employeeBonuses.employeeId, data.employeeId)]
      : undefined

    return await db.query.employeeBonuses.findMany({
      where: conditions,
      with: { employee: true },
      orderBy: [desc(employeeBonuses.createdAt)],
    })
  })

// ── Create bonus ──

const createBonusSchema = z.object({
  employeeId: uuidField,
  amount: z.string().min(1, 'El monto es obligatorio'),
  reason: z.string().min(1, 'El motivo es obligatorio'),
  type: z.enum(['PERFORMANCE', 'COMMISSION', 'SPECIAL', 'HOLIDAY', 'BIRTHDAY', 'OTHER']).default('OTHER'),
  date: z.string().optional(),
})

export const createBonus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createBonusSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [bonus] = await db
      .insert(employeeBonuses)
      .values({
        employeeId: data.employeeId,
        amount: data.amount,
        reason: data.reason,
        type: data.type,
        date: data.date ? new Date(data.date) : new Date(),
        status: 'APPROVED',
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'BONUS',
      entityId: bonus.id,
      description: `Creó bonificación de $${data.amount} para ${data.type}`,
    })

    return bonus
  })

// ── Delete bonus ──

export const deleteBonus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [bonus] = await db
      .delete(employeeBonuses)
      .where(eq(employeeBonuses.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'BONUS',
      entityId: bonus.id,
      description: `Eliminó bonificación de $${bonus.amount}`,
    })

    return bonus
  })
