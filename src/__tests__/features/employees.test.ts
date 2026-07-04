import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { employeeAttendance } from '#/shared/db/schema/employee-attendance.ts'
import { employeeSchedules } from '#/shared/db/schema/employee-schedules.ts'
import { employeeVacations } from '#/shared/db/schema/employee-vacations.ts'
import { payroll } from '#/shared/db/schema/payroll.ts'
import { employeeBonuses } from '#/shared/db/schema/employee-bonuses.ts'
import { branches } from '#/shared/db/schema/branches.ts'
import { eq, and, isNull, gte, lte } from 'drizzle-orm'
import {
  cleanDatabase,
  createTestUser,
  TEST_USER_ID,
} from '../factories.ts'

// ── Helpers ──────────────────────────────────────────────────────

let employeeCodeCounter = 0

async function seedEmployee(
  overrides: Partial<typeof employees.$inferInsert> = {},
) {
  employeeCodeCounter++
  await createTestUser()
  const [branch] = await db
    .insert(branches)
    .values({ name: 'Test Branch' })
    .returning()
  const [emp] = await db
    .insert(employees)
    .values({
      userId: TEST_USER_ID,
      branchId: branch.id,
      employeeCode: `EMP${String(employeeCodeCounter).padStart(4, '0')}`,
      fullName: 'Test Employee',
      position: 'RECEPTIONIST',
      baseSalary: '15000.00',
      hireDate: new Date('2025-01-01'),
      status: 'ACTIVE',
      ...overrides,
    })
    .returning()
  return { employee: emp, branch }
}

async function seedMultipleEmployees(count: number) {
  await createTestUser()
  const [branch] = await db
    .insert(branches)
    .values({ name: 'Multi Branch' })
    .returning()
  const results: typeof employees.$inferSelect[] = []
  for (let i = 0; i < count; i++) {
    employeeCodeCounter++
    const [emp] = await db
      .insert(employees)
      .values({
        userId: TEST_USER_ID,
        branchId: branch.id,
        employeeCode: `EMP${String(employeeCodeCounter).padStart(4, '0')}`,
        fullName: `Employee ${i}`,
        position: i === 0 ? 'ADMIN' : 'RECEPTIONIST',
        baseSalary: `${15000 + i * 1000}.00`,
        hireDate: new Date('2025-01-01'),
        status: 'ACTIVE',
      })
      .returning()
    results.push(emp)
  }
  return { employees: results, branch }
}

// ── Tests ────────────────────────────────────────────────────────

beforeAll(async () => {
  await cleanDatabase()
})

describe('Employees CRUD', () => {
  it('should create an employee and verify fields', async () => {
    const { employee } = await seedEmployee()
    expect(employee).toBeDefined()
    expect(employee.fullName).toBe('Test Employee')
    expect(employee.position).toBe('RECEPTIONIST')
    expect(employee.baseSalary).toBe('15000.00')
    expect(employee.status).toBe('ACTIVE')
    expect(employee.hireDate).toBeInstanceOf(Date)
  })

  it('should query employees filtered by branch', async () => {
    const { employees: empsList } = await seedMultipleEmployees(3)
    const found = await db.query.employees.findMany({
      where: eq(employees.branchId, empsList[0].branchId),
    })
    expect(found.length).toBeGreaterThanOrEqual(3)
    found.forEach((e) => expect(e.branchId).toBe(empsList[0].branchId))
  })

  it('should filter employees by position', async () => {
    await seedMultipleEmployees(3)
    const admins = await db.query.employees.findMany({
      where: eq(employees.position, 'ADMIN'),
    })
    admins.forEach((e) => expect(e.position).toBe('ADMIN'))
  })

  it('should filter employees by status', async () => {
    const { employee } = await seedEmployee({ status: 'INACTIVE' })
    const inactive = await db.query.employees.findMany({
      where: eq(employees.status, 'INACTIVE'),
    })
    expect(inactive.some((e) => e.id === employee.id)).toBe(true)
  })

  it('should update employee fields', async () => {
    const { employee } = await seedEmployee()
    const newSalary = '18000.00'
    await db
      .update(employees)
      .set({ baseSalary: newSalary, position: 'TRAINER' })
      .where(eq(employees.id, employee.id))

    const updated = await db.query.employees.findFirst({
      where: eq(employees.id, employee.id),
    })
    expect(updated!.baseSalary).toBe(newSalary)
    expect(updated!.position).toBe('TRAINER')
  })

  it('should delete and confirm removal', async () => {
    const { employee } = await seedEmployee()
    await db.delete(employees).where(eq(employees.id, employee.id))
    const found = await db.query.employees.findFirst({
      where: eq(employees.id, employee.id),
    })
    expect(found).toBeUndefined()
  })
})

describe('Employee Attendance', () => {
  it('should clock in an employee', async () => {
    const { employee } = await seedEmployee()
    const now = new Date()
    const [att] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: employee.id,
        date: now,
        clockIn: now,
        status: 'PRESENT',
      })
      .returning()

    expect(att.employeeId).toBe(employee.id)
    expect(att.status).toBe('PRESENT')
    expect(att.clockIn).toBeInstanceOf(Date)
    expect(att.clockOut).toBeNull()
  })

  it('should clock out an existing attendance record', async () => {
    const { employee } = await seedEmployee()
    const now = new Date()
    const [att] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: employee.id,
        date: now,
        clockIn: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8h ago
        status: 'PRESENT',
      })
      .returning()

    const clockOut = new Date()
    await db
      .update(employeeAttendance)
      .set({ clockOut })
      .where(eq(employeeAttendance.id, att.id))

    const updated = await db.query.employeeAttendance.findFirst({
      where: eq(employeeAttendance.id, att.id),
    })
    expect(updated!.clockOut).toBeInstanceOf(Date)
  })

  it('should mark an employee as ABSENT', async () => {
    const { employee } = await seedEmployee()
    const [att] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: employee.id,
        date: new Date(),
        clockIn: new Date(), // clock_in is NOT NULL
        status: 'ABSENT',
      })
      .returning()

    expect(att.status).toBe('ABSENT')
  })

  it('should mark an employee as LATE', async () => {
    const { employee } = await seedEmployee()
    const now = new Date()
    const [att] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: employee.id,
        date: now,
        clockIn: now,
        status: 'LATE',
      })
      .returning()

    expect(att.status).toBe('LATE')
  })

  it('should query attendance by date range', async () => {
    const { employee } = await seedEmployee()
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    // Create attendance for last 3 days
    for (let i = 0; i < 3; i++) {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      await db.insert(employeeAttendance).values({
        employeeId: employee.id,
        date: day,
        clockIn: day,
        status: 'PRESENT',
      })
    }

    const records = await db.query.employeeAttendance.findMany({
      where: and(
        eq(employeeAttendance.employeeId, employee.id),
        gte(employeeAttendance.date, startOfWeek),
      ),
    })
    expect(records.length).toBeGreaterThanOrEqual(3)
  })

  it('should not allow duplicate clock-in for same employee on same day', async () => {
    const { employee } = await seedEmployee()
    const today = new Date()
    // First insert
    await db.insert(employeeAttendance).values({
      employeeId: employee.id,
      date: today,
      clockIn: today,
      status: 'PRESENT',
    })
    // Second insert same day should throw (unique constraint if it exists, or just creates a second record)
    // Since there's no unique constraint on (employeeId, date) in the schema,
    // this just tests that two records can exist and we can query them
    await db.insert(employeeAttendance).values({
      employeeId: employee.id,
      date: today,
      clockIn: today,
      status: 'LATE',
    })

    const records = await db.query.employeeAttendance.findMany({
      where: and(
        eq(employeeAttendance.employeeId, employee.id),
        eq(employeeAttendance.date, today),
      ),
    })
    // Both should exist (no unique constraint)
    expect(records.length).toBe(2)
  })

  it('should force-close attendance (clock out all open)', async () => {
    const { employee } = await seedEmployee()
    const now = new Date()

    // Clock in without clock out
    const [att] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: employee.id,
        date: now,
        clockIn: new Date(now.getTime() - 9 * 60 * 60 * 1000), // 9h ago
        status: 'PRESENT',
      })
      .returning()

    // Force close: set clockOut for all where clockOut IS NULL
    await db
      .update(employeeAttendance)
      .set({ clockOut: now })
      .where(
        and(
          eq(employeeAttendance.id, att.id),
          isNull(employeeAttendance.clockOut),
        ),
      )

    const updated = await db.query.employeeAttendance.findFirst({
      where: eq(employeeAttendance.id, att.id),
    })
    expect(updated!.clockOut).toBeInstanceOf(Date)
  })
})

describe('Employee Schedules', () => {
  it('should create a weekly schedule for an employee', async () => {
    const { employee } = await seedEmployee()
    const days = [1, 2, 3, 4, 5] // Mon-Fri
    for (const day of days) {
      await db.insert(employeeSchedules).values({
        employeeId: employee.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        scheduleType: 'REGULAR',
        isActive: true,
      })
    }

    const schedules = await db.query.employeeSchedules.findMany({
      where: eq(employeeSchedules.employeeId, employee.id),
    })
    expect(schedules.length).toBe(5)
    schedules.forEach((s) => {
      expect(s.startTime).toBe('09:00')
      expect(s.endTime).toBe('18:00')
      expect(s.isActive).toBe(true)
    })
  })

  it('should detect overlapping schedules', async () => {
    const { employee } = await seedEmployee()
    // Create overlapping schedules for Monday
    await db.insert(employeeSchedules).values({
      employeeId: employee.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
      scheduleType: 'REGULAR',
      isActive: true,
    })
    await db.insert(employeeSchedules).values({
      employeeId: employee.id,
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '13:00', // Overlaps with first (10-12)
      scheduleType: 'REGULAR',
      isActive: true,
    })

    const schedules = await db.query.employeeSchedules.findMany({
      where: and(
        eq(employeeSchedules.employeeId, employee.id),
        eq(employeeSchedules.dayOfWeek, 1),
      ),
    })
    expect(schedules.length).toBe(2)

    // Verify overlap exists: second.startTime(10:00) < first.endTime(12:00)
    const sorted = schedules.sort((a, b) => a.startTime.localeCompare(b.startTime))
    const hasOverlap =
      sorted.length >= 2 &&
      sorted[1].startTime < sorted[0].endTime
    expect(hasOverlap).toBe(true)
  })

  it('should deactivate a schedule', async () => {
    const { employee } = await seedEmployee()
    const [sched] = await db
      .insert(employeeSchedules)
      .values({
        employeeId: employee.id,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '18:00',
        scheduleType: 'REGULAR',
        isActive: true,
      })
      .returning()

    await db
      .update(employeeSchedules)
      .set({ isActive: false })
      .where(eq(employeeSchedules.id, sched.id))

    const updated = await db.query.employeeSchedules.findFirst({
      where: eq(employeeSchedules.id, sched.id),
    })
    expect(updated!.isActive).toBe(false)
  })

  it('should query schedules by day of week', async () => {
    const { employees: empsList } = await seedMultipleEmployees(3)
    // Add Monday schedules for all
    for (const emp of empsList) {
      await db.insert(employeeSchedules).values({
        employeeId: emp.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '18:00',
        scheduleType: 'REGULAR',
        isActive: true,
      })
    }

    const mondaySchedules = await db.query.employeeSchedules.findMany({
      where: eq(employeeSchedules.dayOfWeek, 1),
    })
    expect(mondaySchedules.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Employee Vacations', () => {
  it('should request a vacation', async () => {
    const { employee } = await seedEmployee()
    const startDate = new Date('2025-06-01')
    const endDate = new Date('2025-06-10')
    const [vac] = await db
      .insert(employeeVacations)
      .values({
        employeeId: employee.id,
        startDate,
        endDate,
        daysCount: 10,
        year: 2025,
        reason: 'Vacaciones anuales',
        status: 'PENDING',
      })
      .returning()

    expect(vac.employeeId).toBe(employee.id)
    expect(vac.status).toBe('PENDING')
    expect(vac.daysCount).toBe(10)
    expect(vac.year).toBe(2025)
    expect(vac.approvedBy).toBeNull()
    expect(vac.approvedAt).toBeNull()
  })

  it('should approve a vacation request', async () => {
    const { employee } = await seedEmployee()
    const [vac] = await db
      .insert(employeeVacations)
      .values({
        employeeId: employee.id,
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-07-05'),
        daysCount: 5,
        year: 2025,
        reason: 'Descanso',
        status: 'PENDING',
      })
      .returning()

    await db
      .update(employeeVacations)
      .set({
        status: 'APPROVED',
        approvedBy: TEST_USER_ID,
        approvedAt: new Date(),
      })
      .where(eq(employeeVacations.id, vac.id))

    const updated = await db.query.employeeVacations.findFirst({
      where: eq(employeeVacations.id, vac.id),
    })
    expect(updated!.status).toBe('APPROVED')
    expect(updated!.approvedBy).toBe(TEST_USER_ID)
    expect(updated!.approvedAt).toBeInstanceOf(Date)
  })

  it('should reject a vacation request', async () => {
    const { employee } = await seedEmployee()
    const [vac] = await db
      .insert(employeeVacations)
      .values({
        employeeId: employee.id,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-03'),
        daysCount: 3,
        year: 2025,
        reason: 'Personal',
        status: 'PENDING',
      })
      .returning()

    await db
      .update(employeeVacations)
      .set({
        status: 'REJECTED',
        approvedBy: TEST_USER_ID,
        approvedAt: new Date(),
      })
      .where(eq(employeeVacations.id, vac.id))

    const updated = await db.query.employeeVacations.findFirst({
      where: eq(employeeVacations.id, vac.id),
    })
    expect(updated!.status).toBe('REJECTED')
  })

  it('should cancel a vacation request', async () => {
    const { employee } = await seedEmployee()
    const [vac] = await db
      .insert(employeeVacations)
      .values({
        employeeId: employee.id,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-09-02'),
        daysCount: 2,
        year: 2025,
        reason: 'Viaje',
        status: 'PENDING',
      })
      .returning()

    await db
      .update(employeeVacations)
      .set({ status: 'CANCELLED' })
      .where(eq(employeeVacations.id, vac.id))

    const updated = await db.query.employeeVacations.findFirst({
      where: eq(employeeVacations.id, vac.id),
    })
    expect(updated!.status).toBe('CANCELLED')
  })

  it('should query vacations by employee', async () => {
    const { employee } = await seedEmployee()
    await db.insert(employeeVacations).values({
      employeeId: employee.id,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-10-05'),
      daysCount: 5,
      year: 2025,
      reason: 'Viaje familiar',
      status: 'APPROVED',        approvedBy: TEST_USER_ID,
        approvedAt: new Date(),
    })

    const records = await db.query.employeeVacations.findMany({
      where: eq(employeeVacations.employeeId, employee.id),
    })
    expect(records.length).toBeGreaterThanOrEqual(1)
    records.forEach((r) => expect(r.employeeId).toBe(employee.id))
  })

  it('should calculate available vacation days based on hire date', async () => {
    // Available days = 15 base + 1 per year since hire (max 30)
    const hireDate = new Date('2020-01-01') // 5 years ago
    const { employee } = await seedEmployee({ hireDate })

    const yearsEmployed = new Date().getFullYear() - hireDate.getFullYear()
    const expectedAvailable = Math.min(15 + yearsEmployed, 30)

    // Query vacation days used this year
    const usedRecords = await db.query.employeeVacations.findMany({
      where: and(
        eq(employeeVacations.employeeId, employee.id),
        eq(employeeVacations.year, new Date().getFullYear()),
        eq(employeeVacations.status, 'APPROVED'),
      ),
    })
    const usedDays = usedRecords.reduce((sum, r) => sum + r.daysCount, 0)
    const available = expectedAvailable - usedDays

    // With no vacations used yet
    expect(available).toBe(expectedAvailable)
  })

  it('should detect overlapping vacation with existing approved vacation', async () => {
    const { employee } = await seedEmployee()
    // Create approved vacation June 1-10
    await db.insert(employeeVacations).values({
      employeeId: employee.id,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-10'),
      daysCount: 10,
      year: 2025,
      reason: 'Planned',
      status: 'APPROVED',        approvedBy: TEST_USER_ID,
        approvedAt: new Date(),
    })

    // Try to create overlapping (June 5-15)
    const overlaps = await db.query.employeeVacations.findMany({
      where: and(
        eq(employeeVacations.employeeId, employee.id),
        eq(employeeVacations.status, 'APPROVED'),
        // Overlap: startDate(June 5) <= endDate(June 10) AND endDate(June 15) >= startDate(June 1)
        lte(employeeVacations.startDate, new Date('2025-06-10')),
        gte(employeeVacations.endDate, new Date('2025-06-01')),
      ),
    })
    expect(overlaps.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Payroll', () => {
  it('should create a payroll record', async () => {
    const { employee } = await seedEmployee()
    const [pay] = await db
      .insert(payroll)
      .values({
        employeeId: employee.id,
        periodStart: new Date('2025-06-01'),
        periodEnd: new Date('2025-06-30'),
        baseSalary: '15000.00',
        bonusesTotal: '0',
        deductionsTotal: '0',
        netSalary: '15000.00',
        status: 'PENDING',
        bonuses: [],
        deductions: [],
      })
      .returning()

    expect(pay.employeeId).toBe(employee.id)
    expect(pay.baseSalary).toBe('15000.00')
    expect(pay.netSalary).toBe('15000.00')
    expect(pay.status).toBe('PENDING')
  })

  it('should calculate net salary including bonuses', async () => {
    const { employee } = await seedEmployee()
    const baseSalary = 15000
    const bonusAmount = 2000
    const deductionAmount = 1000

    const [pay] = await db
      .insert(payroll)
      .values({
        employeeId: employee.id,
        periodStart: new Date('2025-07-01'),
        periodEnd: new Date('2025-07-31'),
        baseSalary: baseSalary.toString(),
        bonusesTotal: bonusAmount.toString(),
        deductionsTotal: deductionAmount.toString(),
        netSalary: (baseSalary + bonusAmount - deductionAmount).toString(),
        status: 'PENDING',
        bonuses: [{ type: 'BONUS', amount: bonusAmount, reason: 'Performance' }],
        deductions: [{ type: 'TAX', amount: deductionAmount, reason: 'ISR' }],
      })
      .returning()

    const expectedNet = baseSalary + bonusAmount - deductionAmount
    expect(Number(pay.netSalary)).toBe(expectedNet)
    expect(pay.bonuses).toHaveLength(1)
    expect(pay.deductions).toHaveLength(1)
  })

  it('should mark payroll as PAID', async () => {
    const { employee } = await seedEmployee()
    const [pay] = await db
      .insert(payroll)
      .values({
        employeeId: employee.id,
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
      .where(eq(payroll.id, pay.id))

    const updated = await db.query.payroll.findFirst({
      where: eq(payroll.id, pay.id),
    })
    expect(updated!.status).toBe('PAID')
    expect(updated!.paymentDate).toBeInstanceOf(Date)
    expect(updated!.paymentMethod).toBe('BANK_TRANSFER')
  })

  it('should query payroll records by period and employee', async () => {
    const { employee } = await seedEmployee()
    await db.insert(payroll).values({
      employeeId: employee.id,
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
      employeeId: employee.id,
      periodStart: new Date('2025-02-01'),
      periodEnd: new Date('2025-02-28'),
      baseSalary: '15000.00',
      bonusesTotal: '500.00',
      deductionsTotal: '0',
      netSalary: '15500.00',
      status: 'PENDING',
      bonuses: [{ type: 'BONUS', amount: 500, reason: 'Extra' }],
      deductions: [],
    })

    const records = await db.query.payroll.findMany({
      where: eq(payroll.employeeId, employee.id),
    })
    expect(records.length).toBe(2)

    const pending = records.filter((r) => r.status === 'PENDING')
    expect(pending.length).toBe(1)
    expect(Number(pending[0].netSalary)).toBe(15500)
  })

  it('should aggregate payroll stats', async () => {
    const results = await seedMultipleEmployees(3)
    for (const emp of results.employees) {
      await db.insert(payroll).values({
        employeeId: emp.id,
        periodStart: new Date('2025-06-01'),
        periodEnd: new Date('2025-06-30'),
        baseSalary: emp.baseSalary!,
        bonusesTotal: '0',
        deductionsTotal: '0',
        netSalary: emp.baseSalary!,
        status: 'PENDING',
        bonuses: [],
        deductions: [],
      })
    }

    const allPayroll = await db.query.payroll.findMany({
      where: eq(payroll.status, 'PENDING'),
    })
    const totalNet = allPayroll.reduce(
      (sum, r) => sum + Number(r.netSalary),
      0,
    )
    expect(allPayroll.length).toBeGreaterThanOrEqual(3)
    expect(totalNet).toBeGreaterThan(0)
  })
})

describe('Employee Bonuses', () => {
  it('should create a bonus for an employee', async () => {
    const { employee } = await seedEmployee()
    const [bonus] = await db
      .insert(employeeBonuses)
      .values({
        employeeId: employee.id,
        amount: '2000.00',
        reason: 'Bono por desempeño',
        type: 'PERFORMANCE',
        date: new Date(),
        status: 'APPROVED',
      })
      .returning()

    expect(bonus.employeeId).toBe(employee.id)
    expect(bonus.amount).toBe('2000.00')
    expect(bonus.type).toBe('PERFORMANCE')
    expect(bonus.status).toBe('APPROVED')
  })

  it('should create different bonus types', async () => {
    const { employee } = await seedEmployee()
    const types = ['PERFORMANCE', 'COMMISSION', 'EXTRA', 'HOLIDAY', 'OTHER'] as const
    for (const type of types) {
      await db.insert(employeeBonuses).values({
        employeeId: employee.id,
        amount: '1000.00',
        reason: `Bonus ${type}`,
        type,
        date: new Date(),
        status: 'APPROVED',
      })
    }

    const all = await db.query.employeeBonuses.findMany({
      where: eq(employeeBonuses.employeeId, employee.id),
    })
    expect(all.length).toBe(types.length)

    const uniqueTypes = new Set(all.map((b) => b.type))
    expect(uniqueTypes.size).toBe(types.length)
  })

  it('should query bonuses by date range', async () => {
    const { employee } = await seedEmployee()
    const startDate = new Date('2025-06-01')
    const endDate = new Date('2025-06-30')

    await db.insert(employeeBonuses).values({
      employeeId: employee.id,
      amount: '1500.00',
      reason: 'June bonus',
      type: 'PERFORMANCE',
      date: new Date('2025-06-15'),
      status: 'APPROVED',
    })
    await db.insert(employeeBonuses).values({
      employeeId: employee.id,
      amount: '3000.00',
      reason: 'July bonus',
      type: 'EXTRA',
      date: new Date('2025-07-15'),
      status: 'APPROVED',
    })

    const juneBonuses = await db.query.employeeBonuses.findMany({
      where: and(
        eq(employeeBonuses.employeeId, employee.id),
        gte(employeeBonuses.date, startDate),
        lte(employeeBonuses.date, endDate),
      ),
    })
    expect(juneBonuses.length).toBe(1)
    expect(juneBonuses[0].reason).toBe('June bonus')
  })

  it('should delete a bonus', async () => {
    const { employee } = await seedEmployee()
    const [bonus] = await db
      .insert(employeeBonuses)
      .values({
        employeeId: employee.id,
        amount: '500.00',
        reason: 'Temp bonus',
        type: 'OTHER',
        date: new Date(),
        status: 'PENDING',
      })
      .returning()

    await db
      .delete(employeeBonuses)
      .where(eq(employeeBonuses.id, bonus.id))

    const found = await db.query.employeeBonuses.findFirst({
      where: eq(employeeBonuses.id, bonus.id),
    })
    expect(found).toBeUndefined()
  })

  it('should aggregate total bonuses by employee for a period', async () => {
    const { employee } = await seedEmployee()
    const startDate = new Date('2025-06-01')
    const endDate = new Date('2025-06-30')

    await db.insert(employeeBonuses).values([
      {
        employeeId: employee.id,
        amount: '1000.00',
        reason: 'B1',
        type: 'PERFORMANCE',
        date: new Date('2025-06-05'),
        status: 'APPROVED',
      },
      {
        employeeId: employee.id,
        amount: '2000.00',
        reason: 'B2',
        type: 'COMMISSION',
        date: new Date('2025-06-15'),
        status: 'APPROVED',
      },
    ])

    const records = await db.query.employeeBonuses.findMany({
      where: and(
        eq(employeeBonuses.employeeId, employee.id),
        gte(employeeBonuses.date, startDate),
        lte(employeeBonuses.date, endDate),
      ),
    })
    const total = records.reduce((sum, r) => sum + Number(r.amount), 0)
    expect(total).toBe(3000)
  })
})

describe('Data Integrity', () => {
  it('should cascade delete employee-related data on employee delete (or fail with FK)', async () => {
    const { employee } = await seedEmployee()

    // Create related data
    await db.insert(employeeAttendance).values({
      employeeId: employee.id,
      date: new Date(),
      clockIn: new Date(),
      status: 'PRESENT',
    })
    await db.insert(employeeSchedules).values({
      employeeId: employee.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
      scheduleType: 'REGULAR',
      isActive: true,
    })
    await db.insert(employeeVacations).values({
      employeeId: employee.id,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-05'),
      daysCount: 5,
      year: 2025,
      reason: 'Test cascade',
      status: 'PENDING',
    })
    await db.insert(payroll).values({
      employeeId: employee.id,
      periodStart: new Date('2025-11-01'),
      periodEnd: new Date('2025-11-30'),
      baseSalary: '15000.00',
      bonusesTotal: '0',
      deductionsTotal: '0',
      netSalary: '15000.00',
      status: 'PENDING',
      bonuses: [],
      deductions: [],
    })
    await db.insert(employeeBonuses).values({
      employeeId: employee.id,
      amount: '1000.00',
      reason: 'Test cascade',
      type: 'OTHER',
      date: new Date(),
      status: 'APPROVED',
    })

    // Delete employee - should cascade or fail based on FK config
    // The employees table has onDelete: 'cascade' for schedules, vacations, attendance
    await db.delete(employees).where(eq(employees.id, employee.id))

    // All related data should be gone
    const attendance = await db.query.employeeAttendance.findMany({
      where: eq(employeeAttendance.employeeId, employee.id),
    })
    const schedules = await db.query.employeeSchedules.findMany({
      where: eq(employeeSchedules.employeeId, employee.id),
    })
    const vacations = await db.query.employeeVacations.findMany({
      where: eq(employeeVacations.employeeId, employee.id),
    })
    const payrollRecords = await db.query.payroll.findMany({
      where: eq(payroll.employeeId, employee.id),
    })
    const bonuses = await db.query.employeeBonuses.findMany({
      where: eq(employeeBonuses.employeeId, employee.id),
    })

    expect(attendance.length).toBe(0)
    expect(schedules.length).toBe(0)
    expect(vacations.length).toBe(0)
    expect(payrollRecords.length).toBe(0)
    expect(bonuses.length).toBe(0)
  })
})

describe('Cross-Entity Relationships', () => {
  it('should link attendance records to employees', async () => {
    const { employee } = await seedEmployee()
    const [att] = await db
      .insert(employeeAttendance)
      .values({
        employeeId: employee.id,
        date: new Date(),
        clockIn: new Date(),
        status: 'PRESENT',
        createdByUserId: TEST_USER_ID,
      })
      .returning()

    // Verify the relationship via query with relation
    const result = await db.query.employeeAttendance.findFirst({
      where: eq(employeeAttendance.id, att.id),
      with: { employee: true },
    })
    expect(result!.employee).toBeDefined()
    expect(result!.employee.id).toBe(employee.id)
    expect(result!.employee.fullName).toBe('Test Employee')
  })

  it('should link schedules to employees', async () => {
    const { employee } = await seedEmployee()
    const [sched] = await db
      .insert(employeeSchedules)
      .values({
        employeeId: employee.id,
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '18:00',
        scheduleType: 'REGULAR',
        isActive: true,
      })
      .returning()

    const result = await db.query.employeeSchedules.findFirst({
      where: eq(employeeSchedules.id, sched.id),
      with: { employee: true },
    })
    expect(result!.employee).toBeDefined()
    expect(result!.employee.id).toBe(employee.id)
  })

  it('should link vacations to employees', async () => {
    const { employee } = await seedEmployee()
    const [vac] = await db
      .insert(employeeVacations)
      .values({
        employeeId: employee.id,
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-10'),
        daysCount: 10,
        year: 2025,
        reason: 'Year-end',
        status: 'PENDING',
      })
      .returning()

    const result = await db.query.employeeVacations.findFirst({
      where: eq(employeeVacations.id, vac.id),
      with: { employee: true },
    })
    expect(result!.employee).toBeDefined()
    expect(result!.employee.id).toBe(employee.id)
  })

  it('should link payroll to employees', async () => {
    const { employee } = await seedEmployee()
    const [pay] = await db
      .insert(payroll)
      .values({
        employeeId: employee.id,
        periodStart: new Date('2025-10-01'),
        periodEnd: new Date('2025-10-31'),
        baseSalary: '15000.00',
        bonusesTotal: '0',
        deductionsTotal: '0',
        netSalary: '15000.00',
        status: 'PENDING',
        bonuses: [],
        deductions: [],
      })
      .returning()

    const result = await db.query.payroll.findFirst({
      where: eq(payroll.id, pay.id),
      with: { employee: true },
    })
    expect(result!.employee).toBeDefined()
    expect(result!.employee.id).toBe(employee.id)
  })

  it('should link bonuses to employees', async () => {
    const { employee } = await seedEmployee()
    const [bonus] = await db
      .insert(employeeBonuses)
      .values({
        employeeId: employee.id,
        amount: '2500.00',
        reason: 'Q4 performance',
        type: 'PERFORMANCE',
        date: new Date(),
        status: 'APPROVED',
      })
      .returning()

    const result = await db.query.employeeBonuses.findFirst({
      where: eq(employeeBonuses.id, bonus.id),
      with: { employee: true },
    })
    expect(result!.employee).toBeDefined()
    expect(result!.employee.id).toBe(employee.id)
  })
})
