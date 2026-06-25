import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { eq } from 'drizzle-orm'
import { cleanDatabase, createTestUser, TEST_USER_ID } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Profile', () => {
  it('should get user profile by ID', async () => {
    await createTestUser()

    const p = await db.query.users.findFirst({
      where: eq(users.id, TEST_USER_ID),
    })
    expect(p).toBeDefined()
    expect(p!.name).toBe('Test User')
    expect(p!.role).toBe('ADMIN')
  })

  it('should update profile name', async () => {
    await db
      .update(users)
      .set({ name: 'Updated Profile' })
      .where(eq(users.id, TEST_USER_ID))
    const p = await db.query.users.findFirst({
      where: eq(users.id, TEST_USER_ID),
    })
    expect(p!.name).toBe('Updated Profile')
  })

  it('should filter users by role', async () => {
    await createTestUser({ role: 'ADMIN', name: 'Admin' })
    const admins = await db.query.users.findMany({
      where: eq(users.role, 'ADMIN'),
    })
    expect(admins.length).toBeGreaterThanOrEqual(1)
    admins.forEach((u) => expect(u.role).toBe('ADMIN'))
  })
})
