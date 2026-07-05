import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { optionalDateString, optionalString, uuidField } from '#/shared/lib/schemas.ts'
import { and, desc, gte, eq, count, SQL } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { auditLogs } from '#/shared/db/schema/audit-logs.ts'
import { requirePermission, getSession } from '#/shared/lib/server-utils.ts'

export interface AuditLogRow {
  id: string
  userId: string | null
  userName: string | null
  userRole: string | null
  action: string
  entityType: string
  entityId: string | null
  description: string
  details: Record<string, any> | null
  ipAddress: string | null
  createdAt: Date
}

const getAuditLogsSchema = z.object({
  action: optionalString,
  entityType: optionalString,
  userId: optionalString,
  dateFrom: optionalDateString,
  dateTo: optionalDateString,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

function serializeRow(row: typeof auditLogs.$inferSelect): AuditLogRow {
  return {
    ...row,
    details: row.details as Record<string, any> | null,
  }
}

export const getAuditLogs = createServerFn({ method: 'GET' })
  .validator((data: unknown) => getAuditLogsSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'audit:read' } })

    const conditions: SQL[] = []
    if (data.action)
      conditions.push(
        eq(
          auditLogs.action,
          data.action as (typeof auditLogs.action.enumValues)[number],
        ),
      )
    if (data.entityType)
      conditions.push(
        eq(
          auditLogs.entityType,
          data.entityType as (typeof auditLogs.entityType.enumValues)[number],
        ),
      )
    if (data.userId) conditions.push(eq(auditLogs.userId, data.userId))
    if (data.dateFrom)
      conditions.push(gte(auditLogs.createdAt, new Date(data.dateFrom)))
    if (data.dateTo)
      conditions.push(gte(auditLogs.createdAt, new Date(data.dateTo)))

    const where = conditions.length > 0 ? and(...conditions) : undefined
    const offset = (data.page - 1) * data.pageSize

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(data.pageSize)
        .offset(offset),
      db.select({ total: count() }).from(auditLogs).where(where),
    ])

    const total = totalResult[0]?.total ?? 0

    return {
      logs: rows.map(serializeRow),
      total,
    }
  })

export const getAuditLog = createServerFn({ method: 'GET' })
  .validator((id: unknown) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    await requirePermission({ data: { permission: 'audit:read' } })

    const result = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1)
    if (result.length === 0) throw new Error('Audit log not found')
    const log = result[0]

    return serializeRow(log)
  })

export const getAuditStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requirePermission({ data: { permission: 'audit:read' } })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const rows = await db
      .select({
        action: auditLogs.action,
        count: count(),
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, thirtyDaysAgo))
      .groupBy(auditLogs.action)
      .orderBy(auditLogs.action)

    return rows
  },
)

export const getAuditSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getSession()
    const role = session?.user.role
    if (!role || role !== 'ADMIN') {
      return { today: 0, week: 0, month: 0 }
    }

    const now = new Date()
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todayResult, weekResult, monthResult] = await Promise.all([
      db
        .select({ total: count() })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, startOfDay)),
      db
        .select({ total: count() })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, startOfWeek)),
      db
        .select({ total: count() })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, startOfMonth)),
    ])

    return {
      today: todayResult[0]?.total ?? 0,
      week: weekResult[0]?.total ?? 0,
      month: monthResult[0]?.total ?? 0,
    }
  },
)
