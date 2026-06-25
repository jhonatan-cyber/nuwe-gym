import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { eq, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { auth } from '#/shared/lib/auth.ts'
import { z } from 'zod'

export const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole({ data: { roles: ['ADMIN'] } })
  return await db.select().from(users).orderBy(desc(users.createdAt))
})

const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'TRAINER']),
})

export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateUserRoleSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [user] = await db
      .update(users)
      .set({ role: data.role, updatedAt: new Date() })
      .where(eq(users.id, data.userId))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'USER',
      description: `Actualizó rol de usuario ${user.name} a ${data.role}`,
    })
    return user
  })

const createStaffUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'TRAINER']),
  password: z.string().optional(),
})

export const createStaffUser = createServerFn({ method: 'POST' })
  .inputValidator((data) => createStaffUserSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const baRole = data.role === 'ADMIN' ? 'admin' : 'user'
    const user = await auth.api.createUser({
      headers: new Headers(),
      body: {
        email: data.email,
        password: data.password || 'Gym123456',
        name: data.name,
        role: baRole,
      },
    })

    await db
      .update(users)
      .set({ role: data.role, emailVerified: true })
      .where(eq(users.id, user.user.id))

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'USER',
      description: `Creó usuario ${data.name}`,
    })

    return user
  })

export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator((userId) => z.string().parse(userId))
  .handler(async ({ data: userId }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    await db.delete(users).where(eq(users.id, userId))

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'USER',
      description: `Eliminó usuario #${userId}`,
    })

    return { success: true }
  })
