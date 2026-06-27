import { db } from '#/shared/db/index.ts'
import { auditLogs } from '#/shared/db/schema/audit-logs.ts'

export async function createAuditLog(params: {
  userId?: string
  userName?: string
  userRole?: string
  action: string
  entityType: string
  entityId?: string
  description: string
  details?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId ?? null,
      userName: params.userName ?? null,
      userRole: params.userRole ?? null,
      action: params.action as (typeof auditLogs.action.enumValues)[number],
      entityType:
        params.entityType as (typeof auditLogs.entityType.enumValues)[number],
      entityId: params.entityId ?? null,
      description: params.description,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
    })
  } catch (err) {
    console.warn(
      '[audit] failed to create audit log:',
      err instanceof Error ? err.message : err,
    )
  }
}
