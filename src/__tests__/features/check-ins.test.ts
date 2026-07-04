import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq } from 'drizzle-orm'
import {
  createMember,
  createPackage,
  createSubscription,
  createBranch,
  cleanDatabase,
  createTestUser,
} from '../factories.ts'
import { validateCheckIn } from '#/features/check-ins/server.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('validateCheckIn', () => {
  it('should ALLOW check-in for active member with valid subscription', async () => {
    const pkg = await createPackage({ name: 'Test Plan', dailyAccessLimit: null })
    const member = await createMember({ status: 'ACTIVE' })
    const now = new Date()
    const future = new Date(now.getTime() + 86400000 * 30)
    await createSubscription(member.id, pkg.id, {
      startDate: new Date(now.getTime() - 86400000 * 7),
      endDate: future,
    })

    const result = await validateCheckIn(member.id)
    expect(result.status).toBe('ALLOWED')
  })

  it('should DENIED_INACTIVE when member does not exist', async () => {
    const result = await validateCheckIn('00000000-0000-0000-0000-000000000000')
    expect(result.status).toBe('DENIED_INACTIVE')
    expect(result.reason).toMatch(/miembro/i)
  })

  it('should DENIED_INACTIVE when member status is INACTIVE', async () => {
    const member = await createMember({ status: 'INACTIVE' })
    const result = await validateCheckIn(member.id)
    expect(result.status).toBe('DENIED_INACTIVE')
  })

  it('should DENIED_SUSPENDED when member status is SUSPENDED', async () => {
    const member = await createMember({ status: 'SUSPENDED' })
    const result = await validateCheckIn(member.id)
    expect(result.status).toBe('DENIED_SUSPENDED')
  })

  it('should DENIED_EXPIRED when member has no subscription', async () => {
    const member = await createMember({ status: 'ACTIVE' })
    const result = await validateCheckIn(member.id)
    expect(result.status).toBe('DENIED_EXPIRED')
  })

  it('should DENIED_EXPIRED when subscription is expired', async () => {
    const pkg = await createPackage()
    const member = await createMember({ status: 'ACTIVE' })
    // Create subscription that ended yesterday
    const past = new Date(Date.now() - 86400000 * 60) // 60 days ago
    const ended = new Date(Date.now() - 86400000) // yesterday
    await createSubscription(member.id, pkg.id, {
      startDate: past,
      endDate: ended,
    })
    const result = await validateCheckIn(member.id)
    expect(result.status).toBe('DENIED_EXPIRED')
  })

  it('should DENIED_BRANCH when member lacks branch access', async () => {
    const pkg = await createPackage({ dailyAccessLimit: null })
    const branchA = await createBranch({ name: 'Branch A' })
    const branchB = await createBranch({ name: 'Branch B' })
    const member = await createMember({ status: 'ACTIVE', branchId: branchA.id })
    const now = new Date()
    const future = new Date(now.getTime() + 86400000 * 30)
    await createSubscription(member.id, pkg.id, {
      startDate: new Date(now.getTime() - 86400000 * 7),
      endDate: future,
    })

    const result = await validateCheckIn(member.id, branchB.id)
    expect(result.status).toBe('DENIED_BRANCH')
  })

  it('should allow with valid branch access', async () => {
    const pkg = await createPackage({ dailyAccessLimit: null })
    const branch = await createBranch({ name: 'Home Branch' })
    const member = await createMember({ status: 'ACTIVE', branchId: branch.id })
    const now = new Date()
    const future = new Date(now.getTime() + 86400000 * 30)
    await createSubscription(member.id, pkg.id, {
      startDate: new Date(now.getTime() - 86400000 * 7),
      endDate: future,
    })

    const result = await validateCheckIn(member.id, branch.id)
    expect(result.status).toBe('ALLOWED')
  })
})
