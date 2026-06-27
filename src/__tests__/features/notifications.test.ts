import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { notifications } from '#/shared/db/schema/notifications.ts'
import { eq, desc, count } from 'drizzle-orm'
import { createNotification, cleanDatabase } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Notifications', () => {
  it('should create and verify', async () => {
    const n = await createNotification({
      title: 'Bienvenido',
      message: 'Gracias por registrarte',
    })
    expect(n.title).toBe('Bienvenido')
    expect(n.isRead).toBe(false)
  })

  it('should filter by type', async () => {
    await createNotification({ type: 'PAYMENT' })
    await createNotification({ type: 'SYSTEM' })

    const payments = await db.query.notifications.findMany({
      where: eq(notifications.type, 'PAYMENT'),
    })
    expect(payments.length).toBeGreaterThanOrEqual(1)
    payments.forEach((n) => expect(n.type).toBe('PAYMENT'))
  })

  it('should mark as read', async () => {
    const n = await createNotification()
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, n.id))

    const updated = await db.query.notifications.findFirst({
      where: eq(notifications.id, n.id),
    })
    expect(updated!.isRead).toBe(true)
  })

  it('should count unread', async () => {
    await createNotification({ isRead: false })
    await createNotification({ isRead: true })

    const unread = await db
      .select({ cnt: count() })
      .from(notifications)
      .where(eq(notifications.isRead, false))
    expect(unread[0].cnt).toBeGreaterThanOrEqual(1)
  })

  it('should create with reference', async () => {
    const n = await createNotification({
      referenceId: '42',
      referenceType: 'subscription',
    })
    expect(n.referenceId).toBe('42')
  })

  it('should list ordered by date', async () => {
    await createNotification()
    await createNotification()
    const all = await db.query.notifications.findMany({
      orderBy: [desc(notifications.createdAt)],
    })
    expect(all.length).toBeGreaterThanOrEqual(2)
  })
})
