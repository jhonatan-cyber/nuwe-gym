import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getRecentCheckIns = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return await db.query.checkIns.findMany({
      orderBy: [desc(checkIns.checkedInAt)],
      limit: 50,
      with: {
        member: true,
        registeredBy: {
          columns: { name: true },
        },
      },
    })
  },
)

const createCheckInSchema = z.object({
  memberId: z.number(),
  notes: z.string().optional(),
})

export type CreateCheckInData = z.infer<typeof createCheckInSchema>

export const createCheckIn = createServerFn({ method: 'POST' })
  .inputValidator((data) => createCheckInSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
    })

    const [checkIn] = await db
      .insert(checkIns)
      .values({
        memberId: data.memberId,
        registeredByUserId: session.user.id,
        notes: data.notes,
        checkedInAt: new Date(),
        resultStatus: 'ALLOWED',
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'CHECK_IN',
      entityId: checkIn.id,
      description: `Registró check-in de socio #${data.memberId}`,
    })

    return checkIn
  })
