import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { departments } from '#/shared/db/schema/departments.ts'
import { requirePermission } from '#/shared/lib/server-utils.ts'

// ── List ──

export const getDepartments = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requirePermission({ data: { permission: 'branches:read' } })
    return await db.query.departments.findMany({
      orderBy: [desc(departments.createdAt)],
    })
  },
)

// ── Get by ID ──

export const getDepartment = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'branches:read' } })
    return await db.query.departments.findFirst({
      where: eq(departments.id, data.id),
    })
  })

// ── Create ──

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().default(''),
  isActive: z.boolean().default(true),
})

export const createDepartment = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createDepartmentSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'branches:write' } })
    const [dept] = await db.insert(departments).values(data).returning()
    return dept
  })

// ── Update ──

const updateDepartmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nombre requerido').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateDepartment = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateDepartmentSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'branches:write' } })
    const { id, ...updates } = data
    const [dept] = await db
      .update(departments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning()
    return dept
  })

// ── Delete ──

export const deleteDepartment = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'branches:write' } })
    await db.delete(departments).where(eq(departments.id, data.id))
    return { success: true }
  })
