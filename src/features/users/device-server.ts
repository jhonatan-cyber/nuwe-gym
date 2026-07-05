import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/shared/db/index.ts'
import { userDevices } from '#/shared/db/schema/user-devices.ts'
import { eq, desc, and } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'

export const getUserDevices = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requirePermission({
      data: { permission: 'users:read' },
    })
    return await db
      .select()
      .from(userDevices)
      .where(eq(userDevices.userId, session.user.id))
      .orderBy(desc(userDevices.lastUsedAt))
  },
)

const trustDeviceSchema = z.object({
  deviceId: z.string(),
  trusted: z.boolean(),
})

export const toggleTrustDevice = createServerFn({ method: 'POST' })
  .validator((data) => trustDeviceSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'users:write' },
    })
    const [device] = await db
      .update(userDevices)
      .set({ isTrusted: data.trusted })
      .where(
        and(
          eq(userDevices.id, data.deviceId),
          eq(userDevices.userId, session.user.id),
        ),
      )
      .returning()
    return device
  })

const removeDeviceSchema = z.object({
  deviceId: z.string(),
})

export const removeDevice = createServerFn({ method: 'POST' })
  .validator((data) => removeDeviceSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'users:write' },
    })
    await db
      .delete(userDevices)
      .where(
        and(
          eq(userDevices.id, data.deviceId),
          eq(userDevices.userId, session.user.id),
        ),
      )
    return { success: true }
  })
