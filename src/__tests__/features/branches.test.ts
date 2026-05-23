import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { branches } from '#/shared/db/schema/branches.ts'
import { eq, count } from 'drizzle-orm'
import { createBranch, cleanDatabase } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Branches', () => {
  it('should create a branch with all fields', async () => {
    const branch = await createBranch({
      name: 'Sucursal Centro',
      address: 'Av. Siempre Viva 123',
      phone: '555-0100',
      email: 'centro@gym.com',
    })

    expect(branch.name).toBe('Sucursal Centro')
    expect(branch.address).toBe('Av. Siempre Viva 123')
    expect(branch.phone).toBe('555-0100')
    expect(branch.email).toBe('centro@gym.com')
  })

  it('should list all branches', async () => {
    await createBranch({ name: 'Sucursal A' })
    await createBranch({ name: 'Sucursal B' })

    const result = await db
      .select({ count: count() })
      .from(branches)

    expect(result[0]!.count).toBeGreaterThanOrEqual(2)
  })

  it('should update branch name and active status', async () => {
    const branch = await createBranch({ name: 'Sucursal Original' })

    const [updated] = await db
      .update(branches)
      .set({ name: 'Sucursal Renovada', isActive: false })
      .where(eq(branches.id, branch.id))
      .returning()

    expect(updated.name).toBe('Sucursal Renovada')
    expect(updated.isActive).toBe(false)
  })

  it('should filter active branches', async () => {
    await createBranch({ name: 'Activa 1', isActive: true })
    await createBranch({ name: 'Activa 2', isActive: true })
    await createBranch({ name: 'Inactiva', isActive: false })

    const active = await db.query.branches.findMany({
      where: eq(branches.isActive, true),
    })

    expect(active.length).toBeGreaterThanOrEqual(2)
    active.forEach((b) => expect(b.isActive).toBe(true))
  })

  it('should create branch with default values', async () => {
    const branch = await createBranch({ name: 'Defaults Test' })

    expect(branch.isActive).toBe(true)
    expect(branch.openingTime).toBe('08:00')
    expect(branch.closingTime).toBe('22:00')
  })
})
