import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc, count as drizzleCount } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { branchIdField, optionalString, requiredString, uuidField } from '#/shared/lib/schemas.ts'

// ── List ──

export const getEmployees = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    return await db.query.employees.findMany({
      orderBy: [desc(employees.createdAt)],
      with: { user: true, branch: true },
    })
  },
)

// ── Get by ID ──

export const getEmployee = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    return await db.query.employees.findFirst({
      where: eq(employees.id, data.id),
      with: { user: true, branch: true },
    })
  })

// ── Create ──

const createEmployeeSchema = z.object({
  fullName: requiredString,
  email: optionalString.default(''),
  phone: optionalString.default(''),
  documentNumber: optionalString.default(''),
  position: requiredString,
  department: optionalString.default(''),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).default('ACTIVE'),
  hireDate: z.string(),
  branchId: optionalString.default(''),
  userId: optionalString.default(''),
  baseSalary: optionalString.default('0'),
  paymentFrequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY']).default('MONTHLY'),
  bankName: optionalString.default(''),
  bankAccountNumber: optionalString.default(''),
  emergencyContactName: optionalString.default(''),
  emergencyContactPhone: optionalString.default(''),
  emergencyContactRelation: optionalString.default(''),
  notes: optionalString.default(''),
})

export const createEmployee = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createEmployeeSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    // Auto-generate employee code
    const [{ count }] = await db.select({ count: drizzleCount() }).from(employees)
    const nextNum = (count ?? 0) + 1
    const employeeCode = `EMP-${String(nextNum).padStart(3, '0')}`

    const [employee] = await db
      .insert(employees)
      .values({
        ...data,
        employeeCode,
        branchId: data.branchId || null,
        userId: data.userId || null,
        hireDate: new Date(data.hireDate),
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      description: `Creó empleado ${employee.fullName} (${employee.employeeCode})`,
    })

    return employee
  })

// ── Update ──

const updateEmployeeSchema = z.object({
  id: uuidField,
  fullName: requiredString,
  email: optionalString.default(''),
  phone: optionalString.default(''),
  documentNumber: optionalString.default(''),
  position: requiredString,
  department: optionalString.default(''),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']),
  isActive: z.boolean().optional(),
  hireDate: z.string(),
  terminationDate: optionalString.default(''),
  branchId: optionalString.default(''),
  userId: optionalString.default(''),
  baseSalary: optionalString.default('0'),
  paymentFrequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY']).default('MONTHLY'),
  bankName: optionalString.default(''),
  bankAccountNumber: optionalString.default(''),
  emergencyContactName: optionalString.default(''),
  emergencyContactPhone: optionalString.default(''),
  emergencyContactRelation: optionalString.default(''),
  notes: optionalString.default(''),
})

export const updateEmployee = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateEmployeeSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [employee] = await db
      .update(employees)
      .set({
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        documentNumber: data.documentNumber || null,
        position: data.position,
        department: data.department || null,
        status: data.status,
        isActive: data.isActive ?? data.status === 'ACTIVE',
        hireDate: new Date(data.hireDate),
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
        branchId: data.branchId || null,
        userId: data.userId || null,
        baseSalary: data.baseSalary || null,
        paymentFrequency: data.paymentFrequency,
        bankName: data.bankName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        emergencyContactRelation: data.emergencyContactRelation || null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      description: `Actualizó empleado ${employee.fullName}`,
    })

    return employee
  })

// ── Delete ──

export const deleteEmployee = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [employee] = await db
      .delete(employees)
      .where(eq(employees.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      description: `Eliminó empleado ${employee.fullName}`,
    })

    return employee
  })

// ── Stats ──

export const getEmployeeStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    const all = await db.select().from(employees)
    return {
      total: all.length,
      active: all.filter((e) => e.status === 'ACTIVE').length,
      onLeave: all.filter((e) => e.status === 'ON_LEAVE').length,
      terminated: all.filter((e) => e.status === 'TERMINATED').length,
      inactive: all.filter((e) => e.status === 'INACTIVE').length,
    }
  },
)
