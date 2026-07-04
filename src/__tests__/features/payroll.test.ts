import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { payroll  } from '#/shared/db/schema/payroll.ts'
import type {PayrollItem} from '#/shared/db/schema/payroll.ts';
import { employeeBonuses } from '#/shared/db/schema/employee-bonuses.ts'
import { branches } from '#/shared/db/schema/branches.ts'
import { eq, desc } from 'drizzle-orm'
import {
  cleanDatabase,
  createTestUser,
  TEST_USER_ID,
} from '../factories.ts'

let empCounter = 0

async function seedEmployee() {
  empCounter++
  await createTestUser()
  const [branch] = await db
    .insert(branches)
    .values({ name: 'Payroll Test' })
    .returning()
  const [emp] = await db
    .insert(employees)
    .values({
      userId: TEST_USER_ID,
      branchId: branch.id,
      employeeCode: `PY${String(empCounter).padStart(4, '0')}`,
      fullName: `Pay Emp ${empCounter}`,
      position: 'RECEPTIONIST',
      baseSalary: '15000.00',
      hireDate: new Date('2025-01-01'),
      status: 'ACTIVE',
    })
    .returning()
  return emp
}

beforeAll(async () => {
  await cleanDatabase()
})

describe('Payroll CRUD', () => {
  it('should create a payroll record with all fields', async () => {
    const emp = await seedEmployee()
    const [record] = await db
      .insert(payroll)
      .values({
        employeeId: emp.id,
        periodStart: new Date('2025-06-01'),
        periodEnd: new Date('2025-06-30'),
        baseSalary: '15000.00',
        bonusesTotal: '0',
        deductionsTotal: '0',
        netSalary: '15000.00',
        status: 'PENDING',
        bonuses: [],
        deductions: [],
        paymentMethod: null,
        paymentDate: null,
      })
      .returning()

    expect(record).toBeDefined()
    expect(record.employeeId).toBe(emp.id)
    expect(record.baseSalary).toBe('15000.00')
    expect(record.netSalary).toBe('15000.00')
    expect(record.status).toBe('PENDING')
    expect(record.paymentDate).toBeNull()
    expect(record.paymentMethod).toBeNull()
  })

  it('should calculate net salary from base + bonuses - deductions', async () => {
    const emp = await seedEmployee()
    const baseSalary = 15000
    const bonusAmount = 2000
    const deductionAmount = 1000

    const [record] = await db
      .insert(payroll)
      .values({
        employeeId: emp.id,
        periodStart: new Date('2025-07-01'),
        periodEnd: new Date('2025-07-31'),
        baseSalary: String(baseSalary),
        bonusesTotal: String(bonusAmount),
        deductionsTotal: String(deductionAmount),
        netSalary: String(baseSalary + bonusAmount - deductionAmount),
        status: 'PENDING',
        bonuses: [{ type: 'BONUS', amount: String(bonusAmount), reason: 'Performance' }],
        deductions: [{ type: 'TAX', amount: String(deductionAmount), reason: 'ISR' }],
      })
      .returning()

    expect(Number(record.netSalary)).toBe(16000)
    expect(record.bonuses).toHaveLength(1)
    expect(record.deductions).toHaveLength(1)
  })

  it('should mark payroll as PAID with payment details', async () => {
    const emp = await seedEmployee()
    const [record] = await db
      .insert(payroll)
      .values({
        employeeId: emp.id,
        periodStart: new Date('2025-08-01'),
        periodEnd: new Date('2025-08-31'),
        baseSalary: '15000.00',
        bonusesTotal: '0',
        deductionsTotal: '0',
        netSalary: '15000.00',
        status: 'PENDING',
        bonuses: [],
        deductions: [],
      })
      .returning()

    await db
      .update(payroll)
      .set({
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: 'BANK_TRANSFER',
      })
      .where(eq(payroll.id, record.id))

    const updated = await db.query.payroll.findFirst({
      where: eq(payroll.id, record.id),
    })
    expect(updated!.status).toBe('PAID')
    expect(updated!.paymentDate).toBeInstanceOf(Date)
    expect(updated!.paymentMethod).toBe('BANK_TRANSFER')
  })

  it('should query payroll records by employee and period', async () => {
    const emp = await seedEmployee()

    // Create two records for different periods
    await db.insert(payroll).values({
      employeeId: emp.id,
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
      baseSalary: '15000.00',
      bonusesTotal: '0',
      deductionsTotal: '0',
      netSalary: '15000.00',
      status: 'PAID',
      bonuses: [],
      deductions: [],
    })
    await db.insert(payroll).values({
      employeeId: emp.id,
      periodStart: new Date('2025-02-01'),
      periodEnd: new Date('2025-02-28'),
      baseSalary: '15000.00',
      bonusesTotal: '500.00',
      deductionsTotal: '0',
      netSalary: '15500.00',
      status: 'PENDING',
      bonuses: [{ type: 'BONUS', amount: '500', reason: 'Extra' }],
      deductions: [],
    })

    const records = await db.query.payroll.findMany({
      where: eq(payroll.employeeId, emp.id),
      orderBy: [desc(payroll.periodStart)],
    })
    expect(records.length).toBe(2)

    const pending = records.filter((r) => r.status === 'PENDING')
    expect(pending).toHaveLength(1)
    expect(Number(pending[0].netSalary)).toBe(15500)
  })

  it('should aggregate payroll totals across employees', async () => {
    const emp1 = await seedEmployee()
    const emp2 = await seedEmployee()

    await db.insert(payroll).values([
      {
        employeeId: emp1.id,
        periodStart: new Date('2025-06-01'),
        periodEnd: new Date('2025-06-30'),
        baseSalary: '15000.00',
        bonusesTotal: '0',
        deductionsTotal: '0',
        netSalary: '15000.00',
        status: 'PENDING',
        bonuses: [],
        deductions: [],
      },
      {
        employeeId: emp2.id,
        periodStart: new Date('2025-06-01'),
        periodEnd: new Date('2025-06-30'),
        baseSalary: '20000.00',
        bonusesTotal: '0',
        deductionsTotal: '0',
        netSalary: '20000.00',
        status: 'PENDING',
        bonuses: [],
        deductions: [],
      },
    ])

    const allPending = await db.query.payroll.findMany({
      where: eq(payroll.status, 'PENDING'),
    })
    expect(allPending.length).toBeGreaterThanOrEqual(2)
    const totalNet = allPending.reduce((sum, r) => sum + Number(r.netSalary), 0)
    expect(totalNet).toBeGreaterThanOrEqual(35000)
  })
})

describe('Payroll - Bonus Integration', () => {
  it('should create bonus and verify it exists alongside payroll', async () => {
    const emp = await seedEmployee()

    // Create a bonus
    const [bonus] = await db
      .insert(employeeBonuses)
      .values({
        employeeId: emp.id,
        amount: '2000.00',
        reason: 'Performance bonus',
        type: 'PERFORMANCE',
        date: new Date('2025-06-15'),
        status: 'APPROVED',
      })
      .returning()

    // Create payroll referencing similar period
    const [record] = await db
      .insert(payroll)
      .values({
        employeeId: emp.id,
        periodStart: new Date('2025-06-01'),
        periodEnd: new Date('2025-06-30'),
        baseSalary: '15000.00',
        bonusesTotal: '2000.00',
        deductionsTotal: '0',
        netSalary: '17000.00',
        status: 'PENDING',
        bonuses: [{ type: bonus.type, amount: String(bonus.amount), reason: bonus.reason }],
        deductions: [],
      })
      .returning()

    expect(record.bonuses).toHaveLength(1)
    expect(Number((record.bonuses as PayrollItem[])[0].amount)).toBe(2000)
  })
})
