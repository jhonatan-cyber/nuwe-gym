import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { pushSubscriptions } from '#/shared/db/schema/push-subscriptions.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'

export const registerPushToken = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(1, 'Token es obligatorio'),
        deviceInfo: z.string().optional().default(''),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    // Check if this token already exists for this user
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.user.id),
          eq(pushSubscriptions.token, data.token),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      return { success: true, alreadyRegistered: true }
    }

    await db.insert(pushSubscriptions).values({
      userId: session.user.id,
      token: data.token,
      deviceInfo: data.deviceInfo || '',
    })

    return { success: true, alreadyRegistered: false }
  })

export const unregisterPushToken = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.user.id),
          eq(pushSubscriptions.token, data.token),
        ),
      )

    return { success: true }
  })

export const getUserPushTokens = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, session.user.id))
  },
)

export const getAllPushTokens = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    const rows = await db
      .select({ token: pushSubscriptions.token })
      .from(pushSubscriptions)

    return rows.map((r) => r.token)
  },
)

export const cleanupInvalidTokens = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ tokens: z.array(z.string()) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })

    for (const token of data.tokens) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.token, token))
    }

    return { deleted: data.tokens.length }
  })
