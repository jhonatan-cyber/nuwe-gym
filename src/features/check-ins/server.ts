import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { eq, desc, and, gte, lte, count } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export type CheckInResultStatus =
  | 'ALLOWED'
  | 'DENIED_EXPIRED'
  | 'DENIED_INACTIVE'
  | 'DENIED_SUSPENDED'
  | 'DENIED_SCHEDULE'

export async function validateCheckIn(memberId: string): Promise<{
  status: CheckInResultStatus
  reason?: string
}> {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
  })
  if (!member) return { status: 'DENIED_INACTIVE', reason: 'Miembro no encontrado' }
  if (member.status === 'INACTIVE')
    return { status: 'DENIED_INACTIVE', reason: 'Socio inactivo' }
  if (member.status === 'SUSPENDED')
    return { status: 'DENIED_SUSPENDED', reason: 'Socio suspendido' }

  // Find active subscription
  const now = new Date()
  const activeSub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.memberId, memberId),
      eq(subscriptions.status, 'ACTIVE'),
      lte(subscriptions.startDate, now),
      gte(subscriptions.endDate, now),
    ),
    with: { package: { with: { allowedDays: true } } },
  })

  if (!activeSub) {
    // Check if there's an expired subscription
    const expiredSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.memberId, memberId),
        eq(subscriptions.status, 'ACTIVE'),
      ),
      orderBy: [desc(subscriptions.endDate)],
    })
    if (expiredSub && expiredSub.endDate < now) {
      return { status: 'DENIED_EXPIRED', reason: 'Suscripcion vencida' }
    }
    return { status: 'DENIED_EXPIRED', reason: 'Sin suscripcion activa' }
  }

  // Check plan rules
  const pkg = activeSub.package
  if (pkg) {
    // Allowed days check
    if (pkg.allowedDays && pkg.allowedDays.length > 0) {
      const today = now.getDay() // 0=Sun, 1=Mon, ...
      const allowedToday = pkg.allowedDays.find(
        (d: any) => d.dayOfWeek === today,
      )
      if (!allowedToday) {
        return {
          status: 'DENIED_SCHEDULE',
          reason: 'Hoy no es un dia permitido',
        }
      }

      // Time window check (per-day override first, then plan default)
      const currentTime = now.toTimeString().slice(0, 5)
      const startTime = allowedToday.startTime || pkg.allowedStartTime
      const endTime = allowedToday.endTime || pkg.allowedEndTime
      if (startTime && currentTime < startTime) {
        return {
          status: 'DENIED_SCHEDULE',
          reason: `Acceso desde las ${startTime}`,
        }
      }
      if (endTime && currentTime > endTime) {
        return {
          status: 'DENIED_SCHEDULE',
          reason: `Acceso hasta las ${endTime}`,
        }
      }
    }

    // Daily access limit check
    if (pkg.dailyAccessLimit && pkg.dailyAccessLimit > 0) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart.getTime() + 86400000)

      const [result] = await db
        .select({ count: count() })
        .from(checkIns)
        .where(
          and(
            eq(checkIns.memberId, memberId),
            gte(checkIns.checkedInAt, todayStart),
            lte(checkIns.checkedInAt, todayEnd),
            eq(checkIns.resultStatus, 'ALLOWED'),
          ),
        )

      if (result.count >= pkg.dailyAccessLimit) {
        return {
          status: 'DENIED_SCHEDULE',
          reason: `Limite diario de ${pkg.dailyAccessLimit} accesos alcanzado`,
        }
      }
    }
  }

  return { status: 'ALLOWED' }
}

const getRecentCheckInsSchema = z.object({
  branchId: z.string().optional(),
})

export const getRecentCheckIns = createServerFn({ method: 'GET' })
  .inputValidator((data) => getRecentCheckInsSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const whereClause = data.branchId
      ? eq(checkIns.branchId, data.branchId)
      : undefined
    return await db.query.checkIns.findMany({
      where: whereClause,
      orderBy: [desc(checkIns.checkedInAt)],
      limit: 50,
      with: {
        member: true,
        registeredBy: {
          columns: { name: true },
        },
      },
    })
  })

const createCheckInSchema = z.object({
  memberId: z.string().uuid(),
  notes: z.string().optional(),
  branchId: z.string().optional(),
})

export type CreateCheckInData = z.infer<typeof createCheckInSchema>

export const createCheckIn = createServerFn({ method: 'POST' })
  .inputValidator((data) => createCheckInSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    const { status } = await validateCheckIn(data.memberId)

    const [checkIn] = await db
      .insert(checkIns)
      .values({
        memberId: data.memberId,
        registeredByUserId: session.user.id,
        notes: data.notes,
        checkedInAt: new Date(),
        resultStatus: status,
        branchId: data.branchId ?? null,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'CHECK_IN',
      entityId: checkIn.id,
      description: `Registró check-in de socio #${data.memberId} (${status})`,
    })

    return checkIn
  })
