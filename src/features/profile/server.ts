import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/shared/lib/auth.ts'
import { db } from '#/shared/db/index.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { eq } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { z } from 'zod'

export const getProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
  return session.user
})

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
})

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })

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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser distinta a la actual',
  path: ['newPassword'],
})

export const changePassword = createServerFn({ method: 'POST' })
  .inputValidator((data) => changePasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
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
