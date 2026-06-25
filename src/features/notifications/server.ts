import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/shared/db/index.ts'
import { notifications } from '#/shared/db/schema/notifications.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { products } from '#/shared/db/schema/products.ts'
import {
  eq,
  desc,
  and,
  lte,
  gte,
  sql,
  count as drizzleCount,
} from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

export const getNotifications = createServerFn({ method: 'GET' })
  .inputValidator((data: { page?: number; pageSize?: number }) =>
    z
      .object({
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(50),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const { page, pageSize } = data
    const offset = (page - 1) * pageSize

    const [allNotifications, totalResult] = await Promise.all([
      db.query.notifications.findMany({
        orderBy: [desc(notifications.createdAt)],
        limit: pageSize,
        offset,
      }),
      db.select({ count: drizzleCount() }).from(notifications),
    ])

    return {
      notifications: allNotifications,
      total: totalResult[0]?.count ?? 0,
      page,
      pageSize,
    }
  })

export const getUnreadCount = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const result = await db
      .select({ count: drizzleCount() })
      .from(notifications)
      .where(eq(notifications.isRead, false))
    return result[0]?.count ?? 0
  },
)

const markAsReadSchema = z.object({ id: z.number() })

export const markAsRead = createServerFn({ method: 'POST' })
  .inputValidator((data) => markAsReadSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, data.id))
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'NOTIFICATION',
      entityId: data.id,
      description: `Marcó notificación #${data.id} como leída`,
    })
    return { success: true }
  })

export const markAllAsRead = createServerFn({ method: 'POST' })
  .inputValidator(() => ({}))
  .handler(async () => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false))
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'NOTIFICATION',
      description: 'Marcó todas las notificaciones como leídas',
    })
    return { success: true }
  })

export const generateNotifications = createServerFn({ method: 'POST' })
  .inputValidator(() => ({}))
  .handler(async () => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const gymSettings = await db.query.settings.findFirst()
    const reminderDays = gymSettings?.membershipReminderDays ?? 7

    const now = new Date()
    const futureDate = new Date(
      now.getTime() + reminderDays * 24 * 60 * 60 * 1000,
    )

    const newNotifications: (typeof notifications.$inferInsert)[] = []

    const expiringSubs = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        lte(subscriptions.endDate, futureDate),
        gte(subscriptions.endDate, now),
      ),
      with: { member: true },
    })

    for (const sub of expiringSubs) {
      const existing = await db.query.notifications.findFirst({
        where: and(
          eq(notifications.type, 'EXPIRATION'),
          eq(notifications.referenceId, sub.id),
        ),
      })
      if (!existing) {
        newNotifications.push({
          type: 'EXPIRATION',
          title: 'Suscripción próxima a vencer',
          message: `La suscripción de ${sub.member.fullName} vence el ${sub.endDate.toLocaleDateString('es-AR')}`,
          referenceId: sub.id,
          referenceType: 'subscription',
        })
      }
    }

    const lowStockProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stockCurrent} <= ${products.stockMinimum}`,
        ),
      )

    for (const product of lowStockProducts) {
      const existing = await db.query.notifications.findFirst({
        where: and(
          eq(notifications.type, 'LOW_STOCK'),
          eq(notifications.referenceId, product.id),
        ),
      })
      if (!existing) {
        newNotifications.push({
          type: 'LOW_STOCK',
          title: 'Stock bajo',
          message: `${product.name} tiene ${product.stockCurrent} unidades (mínimo: ${product.stockMinimum})`,
          referenceId: product.id,
          referenceType: 'product',
        })
      }
    }

    if (newNotifications.length > 0) {
      await db.insert(notifications).values(newNotifications)
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'NOTIFICATION',
      description: `Generó ${newNotifications.length} notificaciones`,
    })

    return newNotifications
  })
