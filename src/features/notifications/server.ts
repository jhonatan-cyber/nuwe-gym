import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { uuidField } from '#/shared/lib/schemas.ts'
import { db } from '#/shared/db/index.ts'
import { notifications } from '#/shared/db/schema/notifications.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { members } from '#/shared/db/schema/members.ts'
import { products } from '#/shared/db/schema/products.ts'
import { productStock } from '#/shared/db/schema/product-stock.ts'
import {
  eq,
  desc,
  and,
  lte,
  gte,
  sql,
  inArray,
  count as drizzleCount,
} from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { classSchedules, classBookings } from '#/shared/db/schema/classes.ts'
import { sendEmail, expirationEmailHtml, expiredEmailHtml, birthdayEmailHtml, classReminderEmailHtml, inactiveEmailHtml } from '#/shared/lib/email.ts'
import { sendWhatsAppTemplate, sendSMS, templateVars_expiration, templateVars_expired, templateVars_birthday, templateVars_inactive } from '#/shared/lib/twilio.ts'
import { pushSubscriptions } from '#/shared/db/schema/push-subscriptions.ts'
import { sendPushToMultipleTokens } from '#/shared/lib/push.ts'

export const getNotifications = createServerFn({ method: 'GET' })
  .validator((data: { page?: number; pageSize?: number }) =>
    z
      .object({
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(50),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'notifications:read' } })
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
    await requirePermission({ data: { permission: 'notifications:read' } })
    const result = await db
      .select({ count: drizzleCount() })
      .from(notifications)
      .where(eq(notifications.isRead, false))
    return result[0]?.count ?? 0
  },
)

const markAsReadSchema = z.object({ id: uuidField })

export const markAsRead = createServerFn({ method: 'POST' })
  .validator((data) => markAsReadSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'notifications:write' } })
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
  .validator(() => ({}))
  .handler(async () => {
    const session = await requirePermission({ data: { permission: 'notifications:write' } })
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

const subscribePushSchema = z.object({
  endpoint: z.string(),
  auth: z.string(),
  p256dh: z.string(),
})

export const subscribePush = createServerFn({ method: 'POST' })
  .validator((data: unknown) => subscribePushSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'notifications:write' } })
    // ponytail: upsert by endpoint — one sub per device per user
    const existing = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, session.user.id), eq(pushSubscriptions.endpoint, data.endpoint)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(pushSubscriptions).values({
        userId: session.user.id,
        endpoint: data.endpoint,
        auth: data.auth,
        p256dh: data.p256dh,
      })
    }
    return { success: true }
  })

const unsubscribePushSchema = z.object({ endpoint: z.string() })

export const unsubscribePush = createServerFn({ method: 'POST' })
  .validator((data: unknown) => unsubscribePushSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'notifications:write' } })
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, session.user.id), eq(pushSubscriptions.endpoint, data.endpoint)))
    return { success: true }
  })

const EXPIRATION_TIERS = [
  { days: 1, label: 'mañana', urgency: 'urgent' },
  { days: 3, label: 'en 3 días', urgency: 'warning' },
  { days: 7, label: 'en una semana', urgency: 'info' },
] as const

export const generateNotifications = createServerFn({ method: 'POST' })
  .validator(() => ({}))
  .handler(async () => {
    const session = await requirePermission({ data: { permission: 'notifications:write' } })

    const gymSettings = await db.query.settings.findFirst()
    const reminderDays = gymSettings?.membershipReminderDays ?? 7

    const now = new Date()
    const maxFutureDate = new Date(
      now.getTime() + reminderDays * 24 * 60 * 60 * 1000,
    )

    const newNotifications: (typeof notifications.$inferInsert)[] = []

    // ── Tiered expiration alerts (1, 3, 7 days) ──
    const activeSubs = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'ACTIVE'),
        lte(subscriptions.endDate, maxFutureDate),
        gte(subscriptions.endDate, now),
      ),
      with: { member: true },
    })

    for (const sub of activeSubs) {
      const msUntilExpiry = new Date(sub.endDate).getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24))

      for (const tier of EXPIRATION_TIERS) {
        if (daysUntilExpiry <= tier.days) {
          const titleSuffix =
            tier.urgency === 'urgent'
              ? '⚠️ Urgente'
              : tier.urgency === 'warning'
                ? '🔔 Aviso'
                : '📋 Recordatorio'
          const existing = await db.query.notifications.findFirst({
            where: and(
              eq(notifications.type, 'EXPIRATION'),
              eq(notifications.referenceId, sub.id),
              eq(
                notifications.title,
                `${titleSuffix} Suscripción vence ${tier.label}`,
              ),
            ),
          })
          if (!existing) {
            newNotifications.push({
              type: 'EXPIRATION',
              title: `${titleSuffix} Suscripción vence ${tier.label}`,
              message: `La membresía de ${sub.member.fullName} vence el ${new Date(sub.endDate).toLocaleDateString('es-AR')}. Quedan ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}.`,
              referenceId: sub.id,
              referenceType: 'subscription',
            })
          }
          break // only fire the most urgent matching tier
        }
      }
    }

    // ── Actually expired subscriptions ──
    const expiredSubs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'EXPIRED'),
      with: { member: true },
    })

    for (const sub of expiredSubs) {
      const existing = await db.query.notifications.findFirst({
        where: and(
          eq(notifications.type, 'EXPIRATION'),
          eq(notifications.referenceId, sub.id),
          sql`${notifications.title} LIKE '%Expiró%'`,
        ),
      })
      if (!existing) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(sub.endDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        newNotifications.push({
          type: 'EXPIRATION',
          title: '🚨 Suscripción expiró',
          message: `La membresía de ${sub.member.fullName} expiró hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}. Renová lo antes posible.`,
          referenceId: sub.id,
          referenceType: 'subscription',
        })
      }
    }

    // ── Low stock products (todas las sucursales) ──
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        stockCurrent: productStock.stockCurrent,
        stockMinimum: productStock.stockMinimum,
        branchId: productStock.branchId,
      })
      .from(productStock)
      .innerJoin(products, eq(productStock.productId, products.id))
      .where(
        and(
          eq(products.isActive, true),
          sql`${productStock.stockCurrent} <= ${productStock.stockMinimum}`,
        ),
      )

    for (const ps of lowStockProducts) {
      const existing = await db.query.notifications.findFirst({
        where: and(
          eq(notifications.type, 'LOW_STOCK'),
          eq(notifications.referenceId, ps.id),
        ),
      })
      if (!existing) {
        newNotifications.push({
          type: 'LOW_STOCK',
          title: 'Stock bajo',
          message: `${ps.name} tiene ${ps.stockCurrent} unidades (mínimo: ${ps.stockMinimum})`,
          referenceId: ps.id,
          referenceType: 'product',
        })
      }
    }

    // ── Inactive member recovery emails ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const inactiveMembers = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.status, 'ACTIVE'),
          sql`${members.email} IS NOT NULL`,
          sql`${members.email} != ''`,
          sql`NOT EXISTS (
            SELECT 1 FROM check_ins
            WHERE check_ins.member_id = ${members.id}
            AND check_ins.checked_in_at >= ${thirtyDaysAgo}
          )`,
        ),
      )

    for (const m of inactiveMembers) {
      // ponytail: no dedup, sends every time generateNotifications runs; add when sending too often
      await sendEmail({
        to: m.email!,
        subject: '💪 Te extrañamos, volvé al gimnasio',
        html: inactiveEmailHtml({
          memberName: m.fullName,
          daysInactive: 30,
        }),
      })
      if (m.phone) {
        await sendWhatsAppTemplate({
          to: m.phone,
          contentSid: gymSettings?.waTemplateInactiveSid ?? '',
          variables: templateVars_inactive(m.fullName, 30, gymSettings?.gymName ?? 'Mi Gimnasio'),
          fallbackBody: `💪 ¡Te extrañamos, ${m.fullName}! Hace 30 días que no venís al gimnasio. Tu membresía sigue activa, pasate cuando quieras.`,
        }).catch((err) => console.error('Error al enviar WhatsApp de inactividad:', err))
        await sendSMS({
          to: m.phone,
          body: `Te extrañamos, ${m.fullName}! Hace 30 días que no venís al gym. Tu membresía sigue activa.`,
        }).catch((err) => console.error('Error al enviar SMS de inactividad:', err))
      }
    }

    // ── Birthday emails (no notification, just email) ──
    const todayBirthdayMembers = await db
      .select()
      .from(members)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${members.birthDate}) = EXTRACT(MONTH FROM CURRENT_DATE)`,
          sql`EXTRACT(DAY FROM ${members.birthDate}) = EXTRACT(DAY FROM CURRENT_DATE)`,
          sql`${members.birthDate} IS NOT NULL`,
          eq(members.status, 'ACTIVE'),
        ),
      )

    for (const m of todayBirthdayMembers) {
      if (m.email) {
        // ponytail: inline send, no queue, no dedup check; add async queue when throughput matters
        await sendEmail({
          to: m.email,
          subject: '🎂 ¡Feliz cumpleaños de parte del gimnasio!',
          html: birthdayEmailHtml({ memberName: m.fullName }),
        })
      }
      if (m.phone) {
        await sendWhatsAppTemplate({
          to: m.phone,
          contentSid: gymSettings?.waTemplateBirthdaySid ?? '',
          variables: templateVars_birthday(m.fullName, gymSettings?.gymName ?? 'Mi Gimnasio'),
          fallbackBody: `🎂 ¡Feliz cumpleaños, ${m.fullName}! Todo el equipo del gimnasio te desea un día increíble. Vení a celebrar con nosotros 🎉`,
        }).catch((err) => console.error('Error al enviar WhatsApp de cumpleaños:', err))
        await sendSMS({
          to: m.phone,
          body: `Feliz cumpleaños, ${m.fullName}! Te esperamos en el gym para celebrar 🎉`,
        }).catch((err) => console.error('Error al enviar SMS de cumpleaños:', err))
      }
    }

    // ── Class reminder emails ──
    const todayDOW = new Date().getDay()
    const tomorrowDOW = (todayDOW + 1) % 7
    const upcomingSchedules = await db.query.classSchedules.findMany({
      where: and(
        inArray(classSchedules.dayOfWeek, [todayDOW, tomorrowDOW]),
        eq(classSchedules.isActive, true),
      ),
      with: {
        class: true,
        bookings: {
          where: eq(classBookings.status, 'CONFIRMED'),
          with: { member: true },
        },
      },
    })

    for (const schedule of upcomingSchedules) {
      const when = schedule.dayOfWeek === todayDOW ? 'hoy' : 'mañana'
      for (const booking of schedule.bookings) {
        if (booking.member.email) {
          // ponytail: inline send; add async queue when throughput matters
          await sendEmail({
            to: booking.member.email,
            subject: `📅 Clase de ${schedule.class.name} ${when}`,
            html: classReminderEmailHtml({
              memberName: booking.member.fullName,
              className: schedule.class.name,
              startTime: schedule.startTime,
              room: schedule.room,
            }),
          })
        }
      }
    }

    if (newNotifications.length > 0) {
      await db.insert(notifications).values(newNotifications)
    }

    // ── Send emails for urgent alerts ──
    for (const sub of activeSubs) {
      const msUntilExpiry = new Date(sub.endDate).getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry <= 1 && sub.member.email) {
        await sendEmail({
          to: sub.member.email,
          subject: '⚠️ Tu membresía vence mañana',
          html: expirationEmailHtml({
            memberName: sub.member.fullName,
            endDate: sub.endDate.toISOString(),
            daysUntilExpiry,
          }),
        })
      }
      if (daysUntilExpiry <= 1 && sub.member.phone) {
        await sendWhatsAppTemplate({
          to: sub.member.phone,
          contentSid: gymSettings?.waTemplateExpirationSid ?? '',
          variables: templateVars_expiration(sub.member.fullName, daysUntilExpiry, new Date(sub.endDate).toLocaleDateString('es-AR'), gymSettings?.gymName ?? 'Mi Gimnasio'),
          fallbackBody: `⚠️ ${sub.member.fullName}, tu membresía del gimnasio vence mañana. Acercate a recepción para renovarla.`,
        }).catch((err) => console.error('Error al enviar WhatsApp de vencimiento de membresía:', err))
        await sendSMS({
          to: sub.member.phone,
          body: `⚠️ ${sub.member.fullName}, tu membresía del gym vence mañana. Renová en recepción.`,
        }).catch((err) => console.error('Error al enviar SMS de vencimiento de membresía:', err))
      }
    }

    for (const sub of expiredSubs) {
      if (sub.member.email) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(sub.endDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        await sendEmail({
          to: sub.member.email,
          subject: '🚨 Tu membresía expiró',
          html: expiredEmailHtml({
            memberName: sub.member.fullName,
            daysOverdue,
          }),
        })
      }
      if (sub.member.phone) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(sub.endDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        await sendWhatsAppTemplate({
          to: sub.member.phone,
          contentSid: gymSettings?.waTemplateExpiredSid ?? '',
          variables: templateVars_expired(sub.member.fullName, daysOverdue, gymSettings?.gymName ?? 'Mi Gimnasio'),
          fallbackBody: `🚨 ${sub.member.fullName}, tu membresía expiró hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}. ¡Renová hoy para no perder el acceso!`,
        }).catch((err) => console.error('Error al enviar WhatsApp de membresía expirada:', err))
        await sendSMS({
          to: sub.member.phone,
          body: `🚨 ${sub.member.fullName}, tu membresía expiró hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}. Renová en recepción.`,
        }).catch((err) => console.error('Error al enviar SMS de membresía expirada:', err))
      }
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'NOTIFICATION',
      description: `Generó ${newNotifications.length} notificaciones, envió emails y comunicaciones`,
    })

    // ponytail: one push per batch, not per notification; split by type when too noisy
    if (newNotifications.length > 0) {
      const allSubs = await db.select().from(pushSubscriptions)
      if (allSubs.length > 0) {
        const result = await sendPushToMultipleTokens(
          allSubs.map((s) => JSON.stringify({ endpoint: s.endpoint, keys: { auth: s.auth, p256dh: s.p256dh } })),
          { title: 'Trainix', body: `${newNotifications.length} nueva${newNotifications.length !== 1 ? 's' : ''} notificación${newNotifications.length !== 1 ? 'es' : ''}`, data: { url: '/notifications' } },
        )
        if (result.invalidTokens.length > 0) {
          const endpoints = result.invalidTokens.map((t) => { try { return JSON.parse(t).endpoint } catch { return '' } }).filter(Boolean)
          if (endpoints.length > 0) {
            await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, endpoints))
          }
        }
      }
    }

    return newNotifications
  })
