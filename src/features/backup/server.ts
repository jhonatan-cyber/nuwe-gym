import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { count, sql } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { branches, userBranches } from '#/shared/db/schema/branches.ts'
import { members } from '#/shared/db/schema/members.ts'
import { membershipPlans } from '#/shared/db/schema/membership-plans.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { productCategories } from '#/shared/db/schema/product-categories.ts'
import { products } from '#/shared/db/schema/products.ts'
import { suppliers } from '#/shared/db/schema/suppliers.ts'
import { purchases, purchaseItems } from '#/shared/db/schema/purchases.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { cashRegisterSessions, cashMovements } from '#/shared/db/schema/cash-register.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { notifications } from '#/shared/db/schema/notifications.ts'
import { classes, classSchedules, classBookings } from '#/shared/db/schema/classes.ts'
import { trainerProfiles, trainerAssignments, trainerAvailability } from '#/shared/db/schema/trainers.ts'
import { membershipFreezes } from '#/shared/db/schema/membership-freezes.ts'
import { auditLogs } from '#/shared/db/schema/audit-logs.ts'
import { users } from '#/shared/db/schema/auth.ts'

const TABLES = {
  settings,
  branches,
  userBranches,
  users,
  members,
  membershipPlans,
  subscriptions,
  membershipPayments,
  productCategories,
  products,
  suppliers,
  purchases,
  purchaseItems,
  sales,
  saleItems,
  checkIns,
  cashRegisterSessions,
  cashMovements,
  inventoryMovements,
  notifications,
  classes,
  classSchedules,
  classBookings,
  trainerProfiles,
  trainerAssignments,
  trainerAvailability,
  membershipFreezes,
  auditLogs,
} as const

type TableName = keyof typeof TABLES

const IMPORT_ORDER: TableName[] = [
  'settings',
  'branches',
  'users',
  'productCategories',
  'membershipPlans',
  'suppliers',
  'classes',
  'notifications',
  'auditLogs',
  'members',
  'products',
  'trainerProfiles',
  'subscriptions',
  'sales',
  'purchases',
  'checkIns',
  'cashRegisterSessions',
  'classSchedules',
  'trainerAssignments',
  'trainerAvailability',
  'userBranches',
  'membershipPayments',
  'purchaseItems',
  'saleItems',
  'classBookings',
  'inventoryMovements',
  'membershipFreezes',
  'cashMovements',
]

async function getAllRows<T>(table: any, batchSize = 1000): Promise<T[]> {
  const rows: T[] = []
  let offset = 0
  while (true) {
    const batch = await db.select().from(table).limit(batchSize).offset(offset)
    if (batch.length === 0) break
    rows.push(...batch)
    offset += batchSize
  }
  return rows
}

const backupDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  data: z.record(z.string(), z.array(z.any())),
})

export const exportDatabase = createServerFn({ method: 'GET' })
  .inputValidator(() => ({}))
  .handler(async () => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const data: Record<string, any[]> = {}

    for (const [name, table] of Object.entries(TABLES)) {
      if (name === 'users') {
        const rows = await db
          .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, updatedAt: users.updatedAt })
          .from(users)
        data[name] = rows
      } else {
        data[name] = await getAllRows(table)
      }
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'EXPORT',
      entityType: 'SETTING',
      description: 'Exportó base de datos',
    })

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data,
    }
  })

export const importDatabase = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => backupDataSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const counts: Record<string, number> = {}

    await db.transaction(async (tx) => {
      const deleteOrder = [...IMPORT_ORDER].reverse()
      for (const name of deleteOrder) {
        const table = TABLES[name]
        await tx.delete(table)
      }

      for (const name of IMPORT_ORDER) {
        const rows = data.data[name]
        if (!rows || rows.length === 0) {
          counts[name] = 0
          continue
        }

        const table = TABLES[name]
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100)
          await tx.insert(table).values(batch).onConflictDoNothing()
        }
        counts[name] = rows.length
      }
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'SETTING',
      description: 'Importó base de datos',
    })

    return counts
  })

export const getBackupInfo = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    const counts: Record<string, number> = {}

    for (const [name, table] of Object.entries(TABLES)) {
      const [result] = await db.select({ total: count() }).from(table)
      counts[name] = result?.total ?? 0
    }

    const dbSizeResult = await db.execute<{ size: string }>(
      sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
    )
    const dbSize = dbSizeResult.rows?.[0]?.size ?? null

    return { counts, dbSize }
  })

const backupSettingsSchema = z.object({
  backupEnabled: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
})

export const saveBackupSettings = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => backupSettingsSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const existing = await db.select({ id: settings.id }).from(settings).limit(1)

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({ backupEnabled: data.backupEnabled, backupFrequency: data.backupFrequency, updatedAt: new Date() })
        .where(sql`${settings.id} = ${existing[0].id}`)
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'SETTING',
      description: `Actualizó configuración de backup: ${data.backupFrequency}`,
    })

    return { success: true }
  })

export const getBackupSettings = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    const row = await db
      .select({ backupEnabled: settings.backupEnabled, backupFrequency: settings.backupFrequency })
      .from(settings)
      .limit(1)

    return row[0] ?? { backupEnabled: false, backupFrequency: 'weekly' }
  })
