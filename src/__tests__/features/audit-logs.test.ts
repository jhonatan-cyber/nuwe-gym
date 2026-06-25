import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { auditLogs } from '#/shared/db/schema/audit-logs.ts'
import { eq, desc, count, and, gte } from 'drizzle-orm'
import { TEST_USER_ID, cleanDatabase } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Audit Logs', () => {
  it('should create a log entry and verify', async () => {
    const [log] = await db
      .insert(auditLogs)
      .values({
        action: 'CREATE',
        entityType: 'MEMBER',
        entityId: 1,
        description: 'Creó un nuevo miembro',
        userId: TEST_USER_ID,
        userName: 'Admin',
        userRole: 'ADMIN',
      })
      .returning()

    expect(log).toBeDefined()
    expect(log.action).toBe('CREATE')
    expect(log.entityType).toBe('MEMBER')
    expect(log.description).toBe('Creó un nuevo miembro')
  })

  it('should filter logs by action type', async () => {
    await db.insert(auditLogs).values([
      {
        action: 'CREATE',
        entityType: 'PRODUCT',
        entityId: 1,
        description: 'crear',
        userId: TEST_USER_ID,
      },
      {
        action: 'UPDATE',
        entityType: 'PRODUCT',
        entityId: 1,
        description: 'actualizar',
        userId: TEST_USER_ID,
      },
      {
        action: 'DELETE',
        entityType: 'PRODUCT',
        entityId: 1,
        description: 'eliminar',
        userId: TEST_USER_ID,
      },
    ])

    const creates = await db.query.auditLogs.findMany({
      where: eq(auditLogs.action, 'CREATE'),
    })

    expect(creates.length).toBeGreaterThanOrEqual(1)
    creates.forEach((l) => expect(l.action).toBe('CREATE'))
  })

  it('should filter by entity type', async () => {
    const memberLogs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.entityType, 'MEMBER'),
    })

    expect(memberLogs.length).toBeGreaterThanOrEqual(1)
    memberLogs.forEach((l) => expect(l.entityType).toBe('MEMBER'))
  })

  it('should list logs ordered by createdAt desc', async () => {
    const all = await db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
    })

    expect(all.length).toBeGreaterThanOrEqual(1)
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].createdAt >= all[i].createdAt).toBe(true)
    }
  })

  it('should combine action and entityType filter', async () => {
    const result = await db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.action, 'CREATE'),
        eq(auditLogs.entityType, 'PRODUCT'),
      ),
    })

    expect(result.length).toBeGreaterThanOrEqual(1)
    result.forEach((l) => {
      expect(l.action).toBe('CREATE')
      expect(l.entityType).toBe('PRODUCT')
    })
  })

  it('should count recent logs', async () => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const recent = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, last24h))

    expect(recent[0].count).toBeGreaterThanOrEqual(1)
  })
})
