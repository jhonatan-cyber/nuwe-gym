import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { desc } from 'drizzle-orm'
import { members } from '#/shared/db/schema/members.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { createMember, createCheckIn, createProduct, createSale, cleanDatabase } from '../factories.ts'

beforeAll(async () => { await cleanDatabase() })

describe('Export', () => {
  it('should export members with selected fields', async () => {
    await createMember()
    await createMember()

    const result = await db.select({
      fullName: members.fullName,
      email: members.email,
      phone: members.phone,
    }).from(members)

    expect(result.length).toBeGreaterThanOrEqual(2)
    for (const r of result) {
      expect(r.fullName).toBeDefined()
      expect(r.email).toBeDefined()
    }
  })

  it('should export recent sales', async () => {
    const p = await createProduct()
    await createSale([{ productId: p.id, quantity: 1, unitPrice: '1000.00' }])

    const data = await db.query.sales.findMany({ orderBy: [desc(sales.createdAt)], limit: 10 })
    expect(data.length).toBeGreaterThanOrEqual(1)
    expect(data[0]!.saleNumber).toBeDefined()
  })

  it('should export recent check-ins', async () => {
    const m = await createMember()
    await createCheckIn(m.id)

    const data = await db.query.checkIns.findMany({ orderBy: [desc(checkIns.checkedInAt)], limit: 10 })
    expect(data.length).toBeGreaterThanOrEqual(1)
    expect(data[0]!.memberId).toBeDefined()
  })
})
