import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { membershipFreezes } from '#/shared/db/schema/membership-freezes.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { eq, and, isNull, gte, lte, desc, inArray } from 'drizzle-orm'

async function getBranchMemberIds(branchId: string): Promise<string[]> {
  const rows = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.branchId, branchId))
  return rows.map((r) => r.id)
}

import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, dateString, optionalString, uuidField } from '#/shared/lib/schemas.ts'

export const getFreezes = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ branchId: branchIdField }).optional(),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    const memberIds = data?.branchId ? await getBranchMemberIds(data.branchId) : undefined
    if (data?.branchId && memberIds!.length === 0) return []
    return await db.query.membershipFreezes.findMany({
      where: memberIds ? inArray(membershipFreezes.memberId, memberIds) : undefined,
      orderBy: [desc(membershipFreezes.createdAt)],
      with: {
        subscription: {
          with: {
            member: true,
            package: true,
          },
        },
        member: true,
      },
    })
  })

export const getMemberFreezes = createServerFn({ method: 'GET' })
  .inputValidator((data: { memberId: number }) =>
    z.object({ memberId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    return await db.query.membershipFreezes.findMany({
      where: eq(membershipFreezes.memberId, data.memberId),
      orderBy: [desc(membershipFreezes.createdAt)],
      with: {
        subscription: {
          with: {
            package: true,
          },
        },
      },
    })
  })

const createFreezeSchema = z.object({
  subscriptionId: uuidField,
  startDate: dateString,
  endDate: dateString,
  reason: optionalString,
})

export type CreateFreezeData = z.infer<typeof createFreezeSchema>

export const createFreeze = createServerFn({ method: 'POST' })
  .inputValidator((data) => createFreezeSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })
    const userId = session.user.id

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, data.subscriptionId),
    })

    if (!sub) throw new Error('Suscripción no encontrada.')
    if (sub.status !== 'ACTIVE')
      throw new Error('La suscripción no está activa.')

    const freezeStart = new Date(data.startDate)
    const freezeEnd = new Date(data.endDate)

    if (freezeStart >= freezeEnd) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin.')
    }

    const overlapping = await db.query.membershipFreezes.findFirst({
      where: and(
        eq(membershipFreezes.subscriptionId, data.subscriptionId),
        isNull(membershipFreezes.resumedAt),
        lte(membershipFreezes.startDate, freezeEnd),
        gte(membershipFreezes.endDate, freezeStart),
      ),
    })

    if (overlapping) {
      throw new Error(
        'Ya existe un congelamiento activo que se superpone con estas fechas.',
      )
    }

    const freezeDurationDays = Math.ceil(
      (freezeEnd.getTime() - freezeStart.getTime()) / (1000 * 60 * 60 * 24),
    )

    const newEndDate = new Date(sub.endDate)
    newEndDate.setDate(newEndDate.getDate() + freezeDurationDays)

    const freeze = await db.transaction(async (tx) => {
      const insertValues = {
        subscriptionId: data.subscriptionId,
        memberId: sub.memberId,
        startDate: freezeStart,
        endDate: freezeEnd,
        reason: data.reason ?? '',
        createdBy: userId,
      }
      const [f] = await tx
        .insert(membershipFreezes)
        .values(insertValues)
        .returning()

      await tx
        .update(subscriptions)
        .set({ endDate: newEndDate, updatedAt: new Date() })
        .where(eq(subscriptions.id, data.subscriptionId))

      return f
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'FREEZE',
      entityType: 'FREEZE',
      entityId: freeze.id,
      description: `Congeló suscripción #${data.subscriptionId}`,
    })

    return freeze
  })

export const resumeSubscription = createServerFn({ method: 'POST' })
  .inputValidator((data: { freezeId: string }) =>
    z.object({ freezeId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const freeze = await db.query.membershipFreezes.findFirst({
      where: eq(membershipFreezes.id, data.freezeId),
      with: { subscription: true },
    })

    if (!freeze) throw new Error('Congelamiento no encontrado.')
    if (freeze.resumedAt)
      throw new Error('Este congelamiento ya fue reanudado.')

    const now = new Date()
    const plannedFreezeDays = Math.ceil(
      (freeze.endDate.getTime() - freeze.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    )

    const actualFreezeDays = Math.ceil(
      (now.getTime() - freeze.startDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    const originalEndDate = new Date(freeze.subscription.endDate)
    originalEndDate.setDate(originalEndDate.getDate() - plannedFreezeDays)

    const newEndDate = new Date(originalEndDate)
    newEndDate.setDate(newEndDate.getDate() + Math.max(0, actualFreezeDays))

    const updated = await db.transaction(async (tx) => {
      await tx
        .update(membershipFreezes)
        .set({ resumedAt: now })
        .where(eq(membershipFreezes.id, data.freezeId))

      const [newSubscription] = await tx
        .update(subscriptions)
        .set({ endDate: newEndDate, updatedAt: new Date() })
        .where(eq(subscriptions.id, freeze.subscriptionId))
        .returning()

      return newSubscription
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'RESUME',
      entityType: 'FREEZE',
      entityId: data.freezeId,
      description: `Reanudó suscripción #${freeze.subscriptionId} luego de congelamiento`,
    })

    return updated
  })

export const getFreezeRules = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    return {
      maxFreezeDays: 90,
      minDaysBetweenFreezes: 30,
    }
  },
)

export const getFrozenSubscriptions = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ branchId: branchIdField }).optional(),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    const memberIds = data?.branchId ? await getBranchMemberIds(data.branchId) : undefined
    if (data?.branchId && memberIds!.length === 0) return []

    const now = new Date()

    const activeFreezes = await db.query.membershipFreezes.findMany({
      where: and(
        memberIds ? inArray(membershipFreezes.memberId, memberIds) : undefined,
        isNull(membershipFreezes.resumedAt),
        lte(membershipFreezes.startDate, now),
        gte(membershipFreezes.endDate, now),
      ),
      orderBy: [desc(membershipFreezes.createdAt)],
      with: {
        subscription: {
          with: {
            member: true,
            package: true,
          },
        },
        member: true,
      },
    })

    return activeFreezes
  },
)
