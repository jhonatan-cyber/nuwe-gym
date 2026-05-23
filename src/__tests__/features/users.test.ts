import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { eq } from 'drizzle-orm'
import { TEST_USER_ID, cleanDatabase } from '../factories.ts'

beforeAll(async () => { await cleanDatabase() })

describe('Users', () => {
  it('should create a user and verify', async () => {
    const now = new Date()
    await db.insert(users).values({
      id: TEST_USER_ID, name: 'Admin User', email: 'admin@users.test',
      emailVerified: true, role: 'ADMIN', createdAt: now, updatedAt: now,
    })

    const found = await db.query.users.findFirst({ where: eq(users.id, TEST_USER_ID) })
    expect(found).toBeDefined()
    expect(found!.name).toBe('Admin User')
    expect(found!.role).toBe('ADMIN')
  })

  it('should filter users by role', async () => {
    const now = new Date()
    await db.insert(users).values({
      id: 'users-rec', name: 'Recep', email: 'rec@users.test',
      emailVerified: true, role: 'RECEPTIONIST', createdAt: now, updatedAt: now,
    }).onConflictDoNothing()
    await db.insert(users).values({
      id: 'users-trn', name: 'Trainer', email: 'trn@users.test',
      emailVerified: true, role: 'TRAINER', createdAt: now, updatedAt: now,
    }).onConflictDoNothing()

    const admins = await db.query.users.findMany({ where: eq(users.role, 'ADMIN') })
    expect(admins.length).toBeGreaterThanOrEqual(1)
    admins.forEach((u) => expect(u.role).toBe('ADMIN'))
  })

  it('should update user name and role', async () => {
    await db.update(users).set({ name: 'Updated', role: 'RECEPTIONIST' }).where(eq(users.id, TEST_USER_ID))
    const updated = await db.query.users.findFirst({ where: eq(users.id, TEST_USER_ID) })
    expect(updated!.name).toBe('Updated')
    expect(updated!.role).toBe('RECEPTIONIST')
  })

  it('should find user by email', async () => {
    const found = await db.query.users.findFirst({ where: eq(users.email, 'admin@users.test') })
    expect(found).toBeDefined()
    expect(found!.email).toBe('admin@users.test')
  })
})
