import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employeeContracts } from '#/shared/db/schema/employee-contracts.ts'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { uuidField, optionalString, requiredString } from '#/shared/lib/schemas.ts'

const createSchema = z.object({
  employeeId: uuidField,
  contractType: z.enum(['INDEFINITE', 'FIXED_TERM', 'TEMPORARY', 'FREELANCE', 'INTERNSHIP']).default('INDEFINITE'),
  startDate: z.string().min(1),
  endDate: optionalString.default(''),
  position: requiredString,
  salary: optionalString.default('0'),
  workingHours: optionalString.default(''),
  benefits: optionalString.default(''),
  terms: optionalString.default(''),
  notes: optionalString.default(''),
})

export type CreateContractData = z.infer<typeof createSchema>

export const createContract = createServerFn({ method: 'POST' })
  .validator((data) => createSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'employees:write' } })

    const [contract] = await db
      .insert(employeeContracts)
      .values({
        employeeId: data.employeeId,
        contractType: data.contractType,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        position: data.position,
        salary: data.salary,
        workingHours: data.workingHours,
        benefits: data.benefits,
        terms: data.terms,
        notes: data.notes,
      })
      .returning()

    return contract
  })

export const getEmployeeContracts = createServerFn({ method: 'GET' })
  .validator((data) => z.object({ employeeId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'employees:read' } })

    return await db.query.employeeContracts.findMany({
      where: eq(employeeContracts.employeeId, data.employeeId),
      orderBy: [desc(employeeContracts.startDate)],
    })
  })

export const deleteContract = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'employees:write' } })
    await db.delete(employeeContracts).where(eq(employeeContracts.id, data.id))
    return { success: true }
  })
