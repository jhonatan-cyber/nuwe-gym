import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { familyGroups, familyMembers } from '#/shared/db/schema/family-groups.ts'
import { eq, desc, and } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { uuidField, optionalString } from '#/shared/lib/schemas.ts'

// ── CRUD ──

export const getFamilyGroups = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requirePermission({ data: { permission: 'members:read' } })
    const groups = await db.query.familyGroups.findMany({
      with: {
        primaryMember: { columns: { id: true, fullName: true, documentNumber: true } },
        familyMembers: {
          with: {
            member: { columns: { id: true, fullName: true, documentNumber: true } },
          },
        },
      },
      orderBy: [desc(familyGroups.createdAt)],
    })
    return groups
  })

export const getFamilyGroupById = createServerFn({ method: 'GET' })
  .validator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    await requirePermission({ data: { permission: 'members:read' } })
    const [group] = await db.query.familyGroups.findMany({
      where: eq(familyGroups.id, id),
      with: {
        primaryMember: { columns: { id: true, fullName: true, documentNumber: true, phone: true, email: true } },
        familyMembers: {
          with: {
            member: { columns: { id: true, fullName: true, documentNumber: true, phone: true, email: true } },
          },
        },
      },
      limit: 1,
    })
    return group ?? null
  })

export const getFamilyGroupByMember = createServerFn({ method: 'GET' })
  .validator((data) => z.object({ memberId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'members:read' } })
    // Check if member is a primary member
    const [asPrimary] = await db.query.familyGroups.findMany({
      where: eq(familyGroups.primaryMemberId, data.memberId),
      with: {
        primaryMember: { columns: { id: true, fullName: true } },
        familyMembers: {
          with: {
            member: { columns: { id: true, fullName: true, documentNumber: true } },
          },
        },
      },
      limit: 1,
    })
    if (asPrimary) return { role: 'primary' as const, group: asPrimary }

    // Check if member is in a family group
    const fm = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.memberId, data.memberId),
      with: {
        familyGroup: {
          with: {
            primaryMember: { columns: { id: true, fullName: true } },
            familyMembers: {
              with: {
                member: { columns: { id: true, fullName: true, documentNumber: true } },
              },
            },
          },
        },
      },
    })
    if (fm) return { role: 'member' as const, group: fm.familyGroup, relationship: fm.relationship }
    return null
  })

const createFamilyGroupSchema = z.object({
  name: optionalString,
  primaryMemberId: uuidField,
  discountPercent: z.number().int().min(0).max(100).default(10),
  branchId: optionalString,
})

export const createFamilyGroup = createServerFn({ method: 'POST' })
  .validator((data) => createFamilyGroupSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })
    const [group] = await db.insert(familyGroups).values({
      name: data.name ?? null,
      primaryMemberId: data.primaryMemberId,
      discountPercent: data.discountPercent,
      branchId: data.branchId ?? null,
    }).returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'FAMILY_GROUP',
      entityId: group.id,
      description: `Creó grupo familiar ${group.name ?? '#' + group.id}`,
    })
    return group
  })

const updateFamilyGroupSchema = z.object({
  id: uuidField,
  name: optionalString,
  discountPercent: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
})

export const updateFamilyGroup = createServerFn({ method: 'POST' })
  .validator((data) => updateFamilyGroupSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })
    const [group] = await db.update(familyGroups).set({
      name: data.name ?? undefined,
      discountPercent: data.discountPercent,
      isActive: data.isActive,
      updatedAt: new Date(),
    }).where(eq(familyGroups.id, data.id)).returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'FAMILY_GROUP',
      entityId: group.id,
      description: `Actualizó grupo familiar ${group.name ?? '#' + group.id}`,
    })
    return group
  })

export const deleteFamilyGroup = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })
    const [deleted] = await db.delete(familyGroups).where(eq(familyGroups.id, data.id)).returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'FAMILY_GROUP',
      entityId: data.id,
      description: `Eliminó grupo familiar ${deleted.name ?? '#' + deleted.id}`,
    })
    return deleted
  })

// ── Family Members management ──

const addFamilyMemberSchema = z.object({
  familyGroupId: uuidField,
  memberId: uuidField,
  relationship: optionalString,
})

export const addFamilyMember = createServerFn({ method: 'POST' })
  .validator((data) => addFamilyMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })

    // Check member isn't already in a different family group
    const existing = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.memberId, data.memberId),
    })
    if (existing) throw new Error('El socio ya pertenece a un grupo familiar')

    const [fm] = await db.insert(familyMembers).values({
      familyGroupId: data.familyGroupId,
      memberId: data.memberId,
      relationship: data.relationship ?? null,
    }).returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'FAMILY_MEMBER',
      entityId: fm.id,
      description: `Agregó socio #${data.memberId} al grupo familiar #${data.familyGroupId}`,
    })
    return fm
  })

export const removeFamilyMember = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })
    const [deleted] = await db.delete(familyMembers).where(eq(familyMembers.id, data.id)).returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'FAMILY_MEMBER',
      entityId: data.id,
      description: `Eliminó miembro del grupo familiar`,
    })
    return deleted
  })

// ── Discount calculation ──

export async function getFamilyDiscount(memberId: string): Promise<number> {
  // Check if member is part of a family group
  const asPrimary = await db.query.familyGroups.findFirst({
    where: and(
      eq(familyGroups.primaryMemberId, memberId),
      eq(familyGroups.isActive, true),
    ),
  })
  if (asPrimary) return asPrimary.discountPercent

  const fm = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.memberId, memberId),
    with: {
      familyGroup: true,
    },
  })
  if (fm?.familyGroup?.isActive) return fm.familyGroup.discountPercent

  return 0
}
