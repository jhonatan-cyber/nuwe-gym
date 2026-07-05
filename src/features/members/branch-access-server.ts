import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/shared/db/index.ts'
import { memberBranches } from '#/shared/db/schema/member-branches.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq, isNull } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { uuidField } from '#/shared/lib/schemas.ts'

// ── Get branches a member has access to (via junction table) ──────

const getMemberBranchesSchema = z.object({
  memberId: uuidField,
})

export const getMemberBranches = createServerFn({ method: 'GET' })
  .validator((data) => getMemberBranchesSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'branches:read' } })
    return await db.query.memberBranches.findMany({
      where: eq(memberBranches.memberId, data.memberId),
      with: { branch: { columns: { id: true, name: true } } },
    })
  })

// ── Set member's branch assignments (replace all) ─────────────────

const setMemberBranchesSchema = z.object({
  memberId: uuidField,
  branchIds: z.array(uuidField),
})

export const setMemberBranches = createServerFn({ method: 'POST' })
  .validator((data) => setMemberBranchesSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'branches:write' } })

    await db.transaction(async (tx) => {
      // Remove all existing assignments
      await tx
        .delete(memberBranches)
        .where(eq(memberBranches.memberId, data.memberId))

      // Insert new assignments
      if (data.branchIds.length > 0) {
        await tx.insert(memberBranches).values(
          data.branchIds.map((branchId) => ({
            memberId: data.memberId,
            branchId,
          })),
        )
      }
    })

    const member = await db.query.members.findFirst({
      where: eq(members.id, data.memberId),
      columns: { fullName: true },
    })

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: data.memberId,
      description: `Actualizó accesos a sucursales de ${member?.fullName ?? data.memberId} (${data.branchIds.length} sucursales)`,
    })

    return { success: true }
  })

// ── Check if member can access a specific branch ──────────────────

export async function canMemberAccessBranch(
  memberId: string,
  branchId: string,
): Promise<boolean> {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
    columns: { id: true, branchId: true },
  })
  if (!member) return false

  // If member's primary branch matches, they have access
  if (member.branchId === branchId) return true

  // Check junction table
  const extraAccess = await db.query.memberBranches.findFirst({
    where: (mb) =>
      eq(mb.memberId, memberId) && eq(mb.branchId, branchId),
    columns: { id: true },
  })
  if (extraAccess) return true

  // Member with no primary branch and no extra branches = shared (accessible everywhere)
  if (!member.branchId) {
    const anyBranches = await db.query.memberBranches.findFirst({
      where: eq(memberBranches.memberId, memberId),
      columns: { id: true },
    })
    // If they have no branch assignments at all, they're shared globally
    if (!anyBranches) return true
  }

  return false
}

// ── Get member IDs that have access to a given branch ─────────────

export async function getMemberIdsForBranch(branchId: string): Promise<string[]> {
  // 1. Members whose primary branch matches
  const primary = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.branchId, branchId))

  // 2. Members with entry in memberBranches for this branch
  const viaJunction = await db
    .select({ memberId: memberBranches.memberId })
    .from(memberBranches)
    .where(eq(memberBranches.branchId, branchId))

  // 3. Members with no branchId and no memberBranches (shared globally)
  const membersWithBranchIds = await db
    .select({ id: members.id, branchId: members.branchId })
    .from(members)
    .where(isNull(members.branchId))

  // Filter: shared members = branchId is null AND no entry in memberBranches
  const allMemberIdsWithExtraAccess = await db
    .select({ memberId: memberBranches.memberId })
    .from(memberBranches)
  const memberIdsWithExtra = new Set(allMemberIdsWithExtraAccess.map((r) => r.memberId))
  const shared = membersWithBranchIds.filter((m) => !memberIdsWithExtra.has(m.id))

  const ids = new Set([
    ...primary.map((r) => r.id),
    ...viaJunction.map((r) => r.memberId),
    ...shared.map((m) => m.id),
  ])

  return Array.from(ids)
}
