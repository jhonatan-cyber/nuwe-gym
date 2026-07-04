import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { employeeDocuments } from '#/shared/db/schema/employee-documents.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { uuidField, optionalString, requiredString } from '#/shared/lib/schemas.ts'

const DOCUMENT_TYPES = [
  'ID', 'CONTRACT', 'RESUME', 'CERTIFICATE',
  'MEDICAL', 'STUDY', 'PAYSLIP', 'OTHER',
] as const

const createSchema = z.object({
  employeeId: uuidField,
  name: requiredString,
  type: z.enum(DOCUMENT_TYPES).default('OTHER'),
  description: optionalString.default(''),
  fileUrl: optionalString.default(''),
  fileName: optionalString.default(''),
  fileSize: optionalString.default(''),
})

export const createDocument = createServerFn({ method: 'POST' })
  .validator((data) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [doc] = await db
      .insert(employeeDocuments)
      .values({
        ...data,
        uploadedById: session.user.id,
      })
      .returning()

    return doc
  })

export const getEmployeeDocuments = createServerFn({ method: 'GET' })
  .validator((data) => z.object({ employeeId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    return await db.query.employeeDocuments.findMany({
      where: eq(employeeDocuments.employeeId, data.employeeId),
      orderBy: [desc(employeeDocuments.createdAt)],
      with: { uploadedBy: { columns: { name: true } } },
    })
  })

export const deleteDocument = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, data.id))
    return { success: true }
  })
