import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { eq } from 'drizzle-orm'
import { auth } from '#/shared/lib/auth.ts'
import { z } from 'zod'

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
