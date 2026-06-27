import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { eq } from 'drizzle-orm'
import { requireRole, getSession } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const generateMemberQR = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ memberId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const member = await db.query.members.findFirst({
      where: eq(members.id, data.memberId),
    })
    if (!member) throw new Error('Miembro no encontrado')

    if (member.qrCode) return { qrCode: member.qrCode }

    const qrCode = crypto.randomUUID()

    await db
      .update(members)
      .set({ qrCode })
      .where(eq(members.id, data.memberId))

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: data.memberId,
      description: `Generó QR para socio ${member.fullName}`,
    })

    return { qrCode }
  })

export const getMemberQRCode = createServerFn({ method: 'GET' })
  .inputValidator((data) => z.object({ memberId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })

    const member = await db.query.members.findFirst({
      where: eq(members.id, data.memberId),
      columns: { qrCode: true, fullName: true },
    })

    return member
  })

export const getMembersWithQR = createServerFn({ method: 'GET' })
  .inputValidator((data) =>
    z.object({ search: z.string().optional() }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })

    let whereClause = undefined
    if (data.search) {
      const { ilike, or } = await import('drizzle-orm')
      whereClause = or(
        ilike(members.fullName, `%${data.search}%`),
        ilike(members.documentNumber, `%${data.search}%`),
      )
    }

    return await db.query.members.findMany({
      where: whereClause,
      orderBy: (m) => [m.fullName],
      columns: {
        id: true,
        fullName: true,
        documentNumber: true,
        qrCode: true,
        photoUrl: true,
      },
    })
  })

export const processQRCheckIn = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ qrToken: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const member = await db.query.members.findFirst({
      where: eq(members.qrCode, data.qrToken),
    })
    if (!member) throw new Error('Código QR inválido o miembro no encontrado')

    let registeredByUserId: string
    let auditCtx = { userId: 'SYSTEM', userName: 'SYSTEM', userRole: 'SYSTEM' }
    try {
      const session = await getSession()
      if (session) {
        registeredByUserId = session.user.id
        auditCtx = getAuditContext(session)
      } else {
        const adminUser = await db.query.users.findFirst({
          where: eq(users.role, 'ADMIN'),
        })
        registeredByUserId = adminUser?.id ?? 'SYSTEM'
      }
    } catch {
      const adminUser = await db.query.users.findFirst({
        where: eq(users.role, 'ADMIN'),
      })
      registeredByUserId = adminUser?.id ?? 'SYSTEM'
    }

    const [checkIn] = await db
      .insert(checkIns)
      .values({
        memberId: member.id,
        registeredByUserId,
        checkedInAt: new Date(),
        resultStatus: 'ALLOWED',
      })
      .returning()

    createAuditLog({
      ...auditCtx,
      action: 'CREATE',
      entityType: 'CHECK_IN',
      entityId: checkIn.id,
      description: `Check-in por QR - Socio: ${member.fullName}`,
    })

    return {
      memberName: member.fullName,
      memberPhotoUrl: member.photoUrl,
      checkedInAt: checkIn.checkedInAt,
    }
  })
