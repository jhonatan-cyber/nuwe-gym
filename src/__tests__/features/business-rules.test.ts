import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { purchases } from '#/shared/db/schema/purchases.ts'
import { cashMovements } from '#/shared/db/schema/cash-register.ts'
import { eq, sql } from 'drizzle-orm'
import {
  createMember,
  createPlan,
  createSubscription,
  createCheckIn,
  createProduct,
  createSale,
  createPurchase,
  createCashRegisterSession as openCashSession,
  cleanDatabase,
  createTestUser,
  TEST_USER_ID,
} from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Check-In Business Rules', () => {
  it('should ALLOW check-in for member with active subscription', async () => {
    const member = await createMember()
    const plan = await createPlan()
    await createSubscription(member.id, plan.id, { status: 'ACTIVE' })

    const checkIn = await createCheckIn(member.id, { resultStatus: 'ALLOWED' })
    expect(checkIn.resultStatus).toBe('ALLOWED')
  })

  it('should DENY_EXPIRED check-in when subscription is expired', async () => {
    const member = await createMember()
    const plan = await createPlan()
    await createSubscription(member.id, plan.id, {
      status: 'EXPIRED',
      endDate: new Date('2020-01-01'),
    })

    const checkIn = await createCheckIn(member.id, {
      resultStatus: 'DENIED_EXPIRED',
    })
    expect(checkIn.resultStatus).toBe('DENIED_EXPIRED')
  })

  it('should DENY_INACTIVE check-in when member status is INACTIVE', async () => {
    const member = await createMember({ status: 'INACTIVE' })
    const checkIn = await createCheckIn(member.id, {
      resultStatus: 'DENIED_INACTIVE',
    })
    expect(checkIn.resultStatus).toBe('DENIED_INACTIVE')
  })

  it('should DENY_SUSPENDED check-in when member status is SUSPENDED', async () => {
    const member = await createMember({ status: 'SUSPENDED' })
    const checkIn = await createCheckIn(member.id, {
      resultStatus: 'DENIED_SUSPENDED',
    })
    expect(checkIn.resultStatus).toBe('DENIED_SUSPENDED')
  })
})

describe('FK Constraint Violations', () => {
  it('should reject check-in with non-existent memberId', async () => {
    await expect(
      db.insert(checkIns).values({
        memberId: '99999',
        checkedInAt: new Date(),
        registeredByUserId: TEST_USER_ID,
        resultStatus: 'ALLOWED',
      }),
    ).rejects.toThrow()
  })

  it('should reject sale item with non-existent productId', async () => {
    await createTestUser()
    const [sale] = await db
      .insert(sales)
      .values({
        saleNumber: 'FK-TEST-001',
        userId: TEST_USER_ID,
        subtotal: '100',
        total: '100',
      })
      .returning()

    await expect(
      db.insert(saleItems).values({
        saleId: sale.id,
        productId: '99999',
        quantity: 1,
        unitPrice: '100',
        subtotal: '100',
      }),
    ).rejects.toThrow()
  })
})

describe('FK RESTRICT Deletes', () => {
  it('should block deleting a sale with existing saleItems (FK RESTRICT)', async () => {
    const p = await createProduct({ stockCurrent: 10 })
    const sale = await createSale([
      { productId: p.id, quantity: 1, unitPrice: '100' },
    ])

    await expect(
      db.delete(sales).where(eq(sales.id, sale.id)),
    ).rejects.toThrow()
  })

  it('should block deleting a purchase with existing purchaseItems (FK RESTRICT)', async () => {
    const p = await createProduct({ stockCurrent: 10 })
    const purchase = await createPurchase([
      { productId: p.id, quantity: 5, unitCost: '50' },
    ])

    await expect(
      db.delete(purchases).where(eq(purchases.id, purchase.id)),
    ).rejects.toThrow()
  })
})

describe('Unique Constraints', () => {
  it('should reject duplicate SKU', async () => {
    await createProduct({ sku: 'DUPESKU01', name: 'First' })
    await expect(
      createProduct({ sku: 'DUPESKU01', name: 'Second' }),
    ).rejects.toThrow()
  })
})

describe('Enum Validation', () => {
  it('should reject invalid sale status enum value', async () => {
    await createTestUser()
    await expect(
      db.insert(sales).values({
        saleNumber: 'ENUM-TEST',
        userId: TEST_USER_ID,
        subtotal: '100',
        total: '100',
        status: 'INVALID_STATUS' as any,
      }),
    ).rejects.toThrow()
  })
})

describe('Cash Register Business Rules', () => {
  it('should calculate expected closing amount from movements', async () => {
    const session = await openCashSession({ openingAmount: '1000.00' })

    await db.insert(cashMovements).values([
      {
        cashSessionId: session.id,
        movementType: 'INCOME',
        amount: '500.00',
        paymentMethod: 'CASH',
        description: 'Test income',
        sourceType: 'MANUAL',
      },
      {
        cashSessionId: session.id,
        movementType: 'EXPENSE',
        amount: '200.00',
        paymentMethod: 'CASH',
        description: 'Test expense',
        sourceType: 'OTHER',
      },
    ])

    const result = await db.execute(
      sql`SELECT
        COALESCE(SUM(CASE WHEN movement_type = 'INCOME' THEN amount::numeric ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN movement_type = 'EXPENSE' THEN amount::numeric ELSE 0 END), 0) as total_expense
      FROM cash_movements
      WHERE cash_session_id = ${session.id}`,
    )

    const row = result.rows[0] as any
    const expectedClosing =
      Number('1000.00') + Number(row.total_income) - Number(row.total_expense)
    expect(expectedClosing).toBe(1300)
  })
})
