import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { users, sessions } from '#/shared/db/schema/auth.ts'
import { auditLogs } from '#/shared/db/schema/audit-logs.ts'
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

export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator((userId) => z.string().parse(userId))
  .handler(async ({ data: userId }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
    if (userResults.length === 0) throw new Error('Usuario no encontrado')
    const user = userResults[0]

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt))

    const userAuditLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50)

    return {
      user,
      sessions: userSessions,
      auditLogs: userAuditLogs.map((log) => ({
        ...log,
        details: log.details as Record<string, any> | null,
      })),
    }
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
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  documentNumber: z.string().regex(/^\d+$/, 'El CI debe contener solo números'),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]+$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'TRAINER']),
})

export const createStaffUser = createServerFn({ method: 'POST' })
  .inputValidator((data) => createStaffUserSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`
    const password = data.documentNumber
    const baRole = data.role === 'ADMIN' ? 'admin' : 'user'

    let user: Awaited<ReturnType<typeof auth.api.createUser>>
    try {
      user = await auth.api.createUser({
        headers: new Headers(),
        body: {
          email: data.email,
          password,
          name: fullName,
          role: baRole,
        },
      })
    } catch (err: any) {
      const message =
        err?.body?.message ||
        err?.message ||
        'No se pudo crear el usuario. Verificá que el email no esté en uso.'
      throw new Error(message)
    }

    await db
      .update(users)
      .set({
        role: data.role,
        emailVerified: true,
        documentNumber: data.documentNumber,
        phone: data.phone || null,
        address: data.address || null,
      })
      .where(eq(users.id, user.user.id))

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'USER',
      description: `Creó usuario ${fullName}`,
    })

    return { ...user, name: fullName }
  })

const updateUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  documentNumber: z
    .string()
    .regex(/^\d+$/, 'El CI debe contener solo números')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]+$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
})

export const updateUser = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateUserSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const [user] = await db
      .update(users)
      .set({
        name: data.name,
        email: data.email,
        documentNumber: data.documentNumber ?? undefined,
        phone: data.phone ?? null,
        address: data.address ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.userId))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'USER',
      description: `Actualizó datos de usuario ${user.name}`,
    })

    return user
  })

const revokeSessionSchema = z.object({
  sessionId: z.string(),
  userName: z.string(),
})

const resetPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const resetUserPassword = createServerFn({ method: 'POST' })
  .inputValidator((data) => resetPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const userResults = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, data.userId))

    if (userResults.length === 0) throw new Error('Usuario no encontrado')
    const user = userResults[0]

    await auth.api.setUserPassword({
      headers: new Headers(),
      body: {
        userId: data.userId,
        newPassword: data.newPassword,
      },
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'USER',
      description: `Reseteó contraseña de usuario ${user.name}`,
    })

    return { success: true }
  })

export const revokeSession = createServerFn({ method: 'POST' })
  .inputValidator((data) => revokeSessionSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const deletedResults = await db
      .delete(sessions)
      .where(eq(sessions.id, data.sessionId))
      .returning({ id: sessions.id, userId: sessions.userId })

    if (deletedResults.length === 0) throw new Error('Sesión no encontrada')

    createAuditLog({
      ...getAuditContext(session),
      action: 'LOGOUT',
      entityType: 'USER',
      description: `Cerró sesión de usuario ${data.userName}`,
    })

    return { success: true }
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

export const checkDbEmpty = createServerFn({ method: 'GET' }).handler(
  async () => {
    const existingUsers = await db.select().from(users).limit(1)
    return { isEmpty: existingUsers.length === 0 }
  },
)

const createInitialAdminSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  documentNumber: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const createInitialAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data) => createInitialAdminSchema.parse(data))
  .handler(async ({ data }) => {
    const existingUsers = await db.select().from(users).limit(1)
    if (existingUsers.length > 0) {
      throw new Error(
        'No se puede crear el administrador inicial si ya existen usuarios.',
      )
    }

    let userId: string
    try {
      const result = await auth.api.signUpEmail({
        headers: new Headers(),
        body: {
          email: data.email,
          password: data.documentNumber,
          name: data.name,
        },
      })
      userId = result.user.id
    } catch (err: any) {
      const message =
        err?.body?.message ||
        err?.message ||
        'No se pudo crear el usuario. Verificá que el email no esté en uso y que el documento tenga al menos 4 caracteres.'
      throw new Error(message)
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        role: 'ADMIN',
        emailVerified: true,
        documentNumber: data.documentNumber,
        phone: data.phone || null,
        address: data.address || null,
      })
      .where(eq(users.id, userId))
      .returning()

    return updatedUser
  })
