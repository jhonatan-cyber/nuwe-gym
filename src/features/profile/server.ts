import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/shared/lib/auth.ts'
import { db } from '#/shared/db/index.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { users, sessions } from '#/shared/db/schema/auth.ts'
import { auditLogs } from '#/shared/db/schema/audit-logs.ts'
import { eq, and, desc } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { z } from 'zod'
import { optionalString } from '#/shared/lib/schemas.ts'

export const getProfile = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requirePermission({
      data: { permission: 'users:read' },
    })
    return session.user
  },
)

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
})

export const updateProfile = createServerFn({ method: 'POST' })
  .validator((data) => updateProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'users:write' },
    })

    await db
      .update(users)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'USER',
      description: 'Actualizó su perfil',
    })

    return { success: true }
  })

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z
      .string()
      .min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta a la actual',
    path: ['newPassword'],
  })

export const changePassword = createServerFn({ method: 'POST' })
  .validator((data) => changePasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'users:write' },
    })
    const request = getRequest()

    await auth.api.changePassword({
      headers: request.headers,
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'USER',
      description: 'Cambió su contraseña',
    })

    return { success: true }
  })

export const getProfileFullData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requirePermission({
      data: { permission: 'users:read' },
    })
    const userId = session.user.id

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    if (!user) throw new Error('Usuario no encontrado')

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
  },
)

const updateProfileInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
  phone: z.string().optional().or(z.literal('')),
  address: optionalString,
})

export const updateProfileInfo = createServerFn({ method: 'POST' })
  .validator((data) => updateProfileInfoSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'users:write' },
    })

    await db
      .update(users)
      .set({
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'USER',
      description: 'Actualizó su perfil',
    })

    return { success: true }
  })

const revokeMySessionSchema = z.object({
  sessionId: z.string(),
})

export const revokeMySession = createServerFn({ method: 'POST' })
  .validator((data) => revokeMySessionSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'users:write' },
    })

    const deletedResults = await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.id, data.sessionId),
          eq(sessions.userId, session.user.id),
        ),
      )
      .returning({ id: sessions.id })

    if (deletedResults.length === 0) throw new Error('Sesión no encontrada')

    createAuditLog({
      ...getAuditContext(session),
      action: 'LOGOUT',
      entityType: 'USER',
      description: 'Cerró su propia sesión',
    })

    return { success: true }
  })
