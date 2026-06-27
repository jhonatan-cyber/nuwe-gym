import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq, desc, ilike, or } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

const getMembersSchema = z.object({
  search: z.string().optional(),
})

export const getMembers = createServerFn({ method: 'GET' })
  .inputValidator((data) => getMembersSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    let whereClause = undefined

    if (data.search) {
      whereClause = or(
        ilike(members.fullName, `%${data.search}%`),
        ilike(members.documentNumber, `%${data.search}%`),
        ilike(members.email, `%${data.search}%`),
      )
    }

    return await db.query.members.findMany({
      where: whereClause,
      orderBy: [desc(members.createdAt)],
      with: {
        subscriptions: {
          where: (subscriptions) => eq(subscriptions.status, 'ACTIVE'),
          with: {
            plan: true,
            package: true,
          },
        },
      },
    })
  })

export const getMemberById = createServerFn({ method: 'GET' })
  .inputValidator((id) => z.string().uuid().parse(id))
  .handler(async ({ data: id }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return await db.query.members.findFirst({
      where: eq(members.id, id),
      with: {
        subscriptions: {
          with: {
            plan: true,
            package: true,
          },
          orderBy: (subscriptions) => [desc(subscriptions.endDate)],
        },
      },
    })
  })

const createMemberSchema = z.object({
  fullName: z.string(),
  documentNumber: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  address: z.string().optional(),
})

export type CreateMemberData = z.infer<typeof createMemberSchema>

export const createMember = createServerFn({ method: 'POST' })
  .inputValidator((data) => createMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [member] = await db
      .insert(members)
      .values({
        fullName: data.fullName,
        documentNumber: data.documentNumber,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        address: data.address,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: `Creó socio ${member.fullName}`,
    })

    return member
  })

const updateMemberSchema = createMemberSchema.extend({
  id: z.string().uuid(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type UpdateMemberData = z.infer<typeof updateMemberSchema>

const uploadPhotoSchema = z.object({
  memberId: z.string().uuid(),
  photoBase64: z.string(),
})

export const uploadMemberPhoto = createServerFn({ method: 'POST' })
  .inputValidator((data) => uploadPhotoSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [member] = await db
      .update(members)
      .set({ photoUrl: data.photoBase64, updatedAt: new Date() })
      .where(eq(members.id, data.memberId))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: `Actualizó foto de socio ${member.fullName}`,
    })

    return member
  })

export const updateMember = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [member] = await db
      .update(members)
      .set({
        fullName: data.fullName,
        documentNumber: data.documentNumber,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        address: data.address,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(members.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: `Actualizó socio ${member.fullName}`,
    })

    return member
  })
