import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employeePerformance } from '#/shared/db/schema/employee-performance.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { uuidField, optionalString } from '#/shared/lib/schemas.ts'

const createSchema = z.object({
  employeeId: uuidField,
  rating: z.coerce.number().int().min(1).max(5).default(3),
  punctuality: z.coerce.number().int().min(1).max(5).default(3),
  teamwork: z.coerce.number().int().min(1).max(5).default(3),
  productivity: z.coerce.number().int().min(1).max(5).default(3),
  attitude: z.coerce.number().int().min(1).max(5).default(3),
  communication: z.coerce.number().int().min(1).max(5).default(3),
  strengths: optionalString.default(''),
  improvements: optionalString.default(''),
  comments: optionalString.default(''),
  recommendation: optionalString.default(''),
})

export type CreatePerformanceData = z.infer<typeof createSchema>

export const createPerformance = createServerFn({ method: 'POST' })
  .inputValidator((data) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [evalRecord] = await db
      .insert(employeePerformance)
      .values({
        ...data,
        evaluatedById: session.user.id,
      })
      .returning()

    return evalRecord
  })

export const getEmployeePerformances = createServerFn({ method: 'GET' })
  .inputValidator((data) => z.object({ employeeId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    return await db.query.employeePerformance.findMany({
      where: eq(employeePerformance.employeeId, data.employeeId),
      orderBy: [desc(employeePerformance.evaluationDate)],
      with: { evaluatedBy: { columns: { name: true } } },
    })
  })

export const deletePerformance = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    await db.delete(employeePerformance).where(eq(employeePerformance.id, data.id))
    return { success: true }
  })
