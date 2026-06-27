import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { eq } from 'drizzle-orm'
import { cleanDatabase } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Settings', () => {
  it('should insert and read settings', async () => {
    await db.insert(settings).values({
      gymName: 'Mi Gimnasio',
      gymAddress: 'Calle Falsa 123',
      gymPhone: '555-0000',
      gymEmail: 'info@gimnasio.com',
    })

    const s = await db.query.settings.findFirst()
    expect(s).toBeDefined()
    expect(s!.gymName).toBe('Mi Gimnasio')
    expect(s!.gymAddress).toBe('Calle Falsa 123')
    expect(s!.gymPhone).toBe('555-0000')
  })

  it('should update gym name and address', async () => {
    await db
      .update(settings)
      .set({ gymName: 'Gym Actualizado', gymAddress: 'Av. Nueva 456' })
      .where(eq(settings.id, '00000000-0000-0000-0000-000000000000'))

    const s = await db.query.settings.findFirst()
    expect(s!.gymName).toBe('Gym Actualizado')
    expect(s!.gymAddress).toBe('Av. Nueva 456')
  })

  it('should toggle boolean settings', async () => {
    await db
      .update(settings)
      .set({ enableAutoRenew: true, backupEnabled: true })
      .where(eq(settings.id, '00000000-0000-0000-0000-000000000000'))

    const s = await db.query.settings.findFirst()
    expect(s!.enableAutoRenew).toBe(true)
    expect(s!.backupEnabled).toBe(true)
  })

  it('should update numeric thresholds', async () => {
    await db
      .update(settings)
      .set({ lowStockThreshold: 10, membershipReminderDays: 14 })
      .where(eq(settings.id, '00000000-0000-0000-0000-000000000000'))

    const s = await db.query.settings.findFirst()
    expect(s!.lowStockThreshold).toBe(10)
    expect(s!.membershipReminderDays).toBe(14)
  })
})
