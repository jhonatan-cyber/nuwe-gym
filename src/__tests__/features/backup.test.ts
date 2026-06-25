import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { products } from '#/shared/db/schema/products.ts'
import { count } from 'drizzle-orm'
import { createMember, createProduct, cleanDatabase } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Backup — Table Counts', () => {
  it('should count records across tables', async () => {
    await createMember()
    await createProduct()

    const memberCount = await db.select({ count: count() }).from(members)
    const productCount = await db.select({ count: count() }).from(products)

    expect(memberCount[0].count).toBeGreaterThanOrEqual(1)
    expect(productCount[0].count).toBeGreaterThanOrEqual(1)
  })

  it('should return non-zero counts for multiple tables', async () => {
    await createMember()
    await createProduct()
    await createMember()

    const m = await db.select({ count: count() }).from(members)
    const p = await db.select({ count: count() }).from(products)

    expect(m[0].count + p[0].count).toBeGreaterThan(1)
  })

  it('should list all members ordered by createdAt', async () => {
    await createMember()
    await createMember()

    const all = await db.query.members.findMany({
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      limit: 10,
    })

    expect(all.length).toBeGreaterThanOrEqual(2)
  })
})
