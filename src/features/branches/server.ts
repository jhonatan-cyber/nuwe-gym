import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { branches, userBranches } from '#/shared/db/schema/branches.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { optionalString, requiredString, timeString, uuidField } from '#/shared/lib/schemas.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

export const getBranches = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    return await db.select().from(branches).orderBy(desc(branches.createdAt))
  },
)

export const getBranch = createServerFn({ method: 'GET' })
  .inputValidator((id: unknown) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    const result = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1)
    return result.length > 0 ? result[0] : null
  })

const createBranchSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  address: optionalString.default(''),
  phone: optionalString.default(''),
  email: optionalString.default(''),
  openingTime: timeString.optional().default('08:00'),
  closingTime: timeString.optional().default('22:00'),
})

export const createBranch = createServerFn({ method: 'POST' })
  .inputValidator((data) => createBranchSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [branch] = await db.insert(branches).values(data).returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'BRANCH',
      entityId: branch.id,
      description: `Creó sucursal ${branch.name}`,
    })
    return branch
  })

const updateBranchSchema = z.object({
  id: uuidField,
  name: requiredString,
  address: optionalString,
  phone: optionalString,
  email: optionalString,
  isActive: z.boolean().optional(),
  openingTime: timeString.optional(),
  closingTime: timeString.optional(),
})

export const updateBranch = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateBranchSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [branch] = await db
      .update(branches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(branches.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'BRANCH',
      entityId: branch.id,
      description: `Actualizó sucursal ${branch.name}`,
    })
    return branch
  })

export const getUserBranches = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    // ADMIN ve todas las sucursales activas; los demás solo las asignadas
    if (session.user.role === 'ADMIN') {
      return await db
        .select({
          id: branches.id,
          name: branches.name,
          address: branches.address,
          phone: branches.phone,
          email: branches.email,
          isActive: branches.isActive,
          openingTime: branches.openingTime,
          closingTime: branches.closingTime,
          isDefault: sql`false`.mapWith(Boolean),
        })
        .from(branches)
        .where(eq(branches.isActive, true))
        .orderBy(branches.name)
    }

    const rows = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        phone: branches.phone,
        email: branches.email,
        isActive: branches.isActive,
        openingTime: branches.openingTime,
        closingTime: branches.closingTime,
        isDefault: userBranches.isDefault,
      })
      .from(userBranches)
      .innerJoin(branches, eq(userBranches.branchId, branches.id))
      .where(eq(userBranches.userId, session.user.id))

    return rows
  },
)

export const deleteBranch = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    // Check if branch has users assigned
    const usersWithBranch = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userBranches)
      .where(eq(userBranches.branchId, data.id))

    if (usersWithBranch[0]?.count > 0) {
      throw new Error('No se puede eliminar una sucursal con usuarios asignados. Desasígnalos primero.')
    }

    // Hard delete
    const [branch] = await db
      .delete(branches)
      .where(eq(branches.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'BRANCH',
      entityId: branch.id,
      description: `Eliminó sucursal ${branch.name}`,
    })

    return branch
  })

export const setDefaultBranch = createServerFn({ method: 'POST' })
  .inputValidator((data) =>
    z.object({ branchId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    await db
      .update(userBranches)
      .set({ isDefault: false })
      .where(eq(userBranches.userId, session.user.id))

    await db
      .update(userBranches)
      .set({ isDefault: true })
      .where(
        and(
          eq(userBranches.userId, session.user.id),
          eq(userBranches.branchId, data.branchId),
        ),
      )

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'BRANCH',
      entityId: data.branchId,
      description: `Cambió sucursal por defecto a #${data.branchId}`,
    })

    return { success: true }
  })

export const getSessionBranch = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    const result = await db
      .select({
        id: branches.id,
        name: branches.name,
      })
      .from(userBranches)
      .innerJoin(branches, eq(userBranches.branchId, branches.id))
      .where(
        and(
          eq(userBranches.userId, session.user.id),
          eq(userBranches.isDefault, true),
        ),
      )
      .limit(1)

    return result.length > 0 ? result[0] : null
  },
)
