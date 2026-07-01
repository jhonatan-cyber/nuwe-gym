import { createServerFn } from '@tanstack/react-start'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq } from 'drizzle-orm'
import {
  findMembers,
  findMemberById,
  insertMember,
  updateMemberById,
  updateMemberPhoto,
  hardDeleteMember,
} from './members.repository.ts'
import { uuidField, requiredString } from '#/shared/lib/schemas.ts'
import {
  getMembersSchema,
  createMemberSchema,
  updateMemberSchema,
  uploadPhotoSchema,
  toggleMemberStatusSchema,
  deleteMemberSchema,
} from './members.schema.ts'
import { z } from 'zod'

export type { CreateMemberData, UpdateMemberData } from './members.schema.ts'

const getMemberByDocumentSchema = z.object({
  documentNumber: requiredString,
})

export const getMemberByDocumentNumber = createServerFn({ method: 'GET' })
  .inputValidator((data) => getMemberByDocumentSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const [member] = await db
      .select({ id: members.id, fullName: members.fullName, documentNumber: members.documentNumber })
      .from(members)
      .where(eq(members.documentNumber, data.documentNumber))
      .limit(1)
    return member ?? null
  })

export const getMembers = createServerFn({ method: 'GET' })
  .inputValidator((data) => getMembersSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return findMembers(data)
  })

export const getMemberById = createServerFn({ method: 'GET' })
  .inputValidator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return findMemberById(id)
  })

export const createMember = createServerFn({ method: 'POST' })
  .inputValidator((data) => createMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const insertData = {
      ...data,
      branchId: data.branchId ?? null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      physicalRestrictions: data.physicalRestrictions ?? null,
      medicalNotes: data.medicalNotes ?? null,
      contractSignature: data.contractSignature ?? null,
    }
    console.log('[createMember] data:', JSON.stringify(insertData, (_, v) => v instanceof Date ? v.toISOString() : v))
    let member
    try {
      member = await insertMember(insertData)
    } catch (dbErr) {
      console.error('[createMember] DB error:', dbErr)
      throw dbErr
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: `Creó socio ${member.fullName}`,
    })

    return member
  })

export const updateMember = createServerFn({ method: 'POST' })
  .inputValidator((data) => updateMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const member = await updateMemberById({
      id: data.id,
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
      branchId: data.branchId ?? null,
      physicalRestrictions: data.physicalRestrictions ?? null,
      medicalNotes: data.medicalNotes ?? null,
      contractSignature: data.contractSignature ?? null,
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: `Actualizó socio ${member.fullName}`,
    })

    return member
  })

export const toggleMemberStatus = createServerFn({ method: 'POST' })
  .inputValidator((data) => toggleMemberStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [member] = await db
      .update(members)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(members.id, data.memberId))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: data.status === 'ACTIVE'
        ? `Activó socio ${member.fullName}`
        : `Desactivó socio ${member.fullName}`,
    })

    return member
  })

export const deleteMember = createServerFn({ method: 'POST' })
  .inputValidator((data) => deleteMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const member = await hardDeleteMember(data.memberId)

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: `Eliminó socio ${member.fullName}`,
    })

    return member
  })

export const uploadMemberPhoto = createServerFn({ method: 'POST' })
  .inputValidator((data) => uploadPhotoSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const member = await updateMemberPhoto(data.memberId, data.photoBase64)

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: member.id,
      description: `Actualizó foto de socio ${member.fullName}`,
    })

    return member
  })
