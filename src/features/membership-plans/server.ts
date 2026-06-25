import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { membershipPlans } from '#/shared/db/schema/membership-plans.ts'
import { eq, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getPlans = createServerFn({ method: 'GET' }).handler(async () => {
  return await db.query.membershipPlans.findMany({
    orderBy: [desc(membershipPlans.createdAt)],
  })
})

export const getActivePlans = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.query.membershipPlans.findMany({
      where: eq(membershipPlans.isActive, true),
      orderBy: [desc(membershipPlans.createdAt)],
    })
  },
)

const createPlanSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  durationDays: z.number(),
  price: z.string(),
})

export const createPlan = createServerFn({ method: 'POST' })
  .inputValidator((data) => createPlanSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [plan] = await db
      .insert(membershipPlans)
      .values({
        name: data.name,
        description: data.description,
        durationDays: data.durationDays,
        price: data.price,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PLAN',
      entityId: plan.id,
      description: `Creó plan ${plan.name}`,
    })

    return plan
  })

const updatePlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  durationDays: z.number(),
  price: z.string(),
  isActive: z.boolean(),
})

export const updatePlan = createServerFn({ method: 'POST' })
  .inputValidator((data) => updatePlanSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [plan] = await db
      .update(membershipPlans)
      .set({
        name: data.name,
        description: data.description,
        durationDays: data.durationDays,
        price: data.price,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(membershipPlans.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'PLAN',
      entityId: plan.id,
      description: `Actualizó plan ${plan.name}`,
    })

    return plan
  })
