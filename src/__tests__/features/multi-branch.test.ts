import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { memberBranches } from '#/shared/db/schema/member-branches.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq, sql } from 'drizzle-orm'
import {
  createBranch,
  createMember,
} from '../factories.ts'
import { canMemberAccessBranch, getMemberIdsForBranch } from '#/features/members/branch-access-server.ts'
import { findMembers } from '#/features/members/members.repository.ts'



// ── Helpers ─────────────────────────────────────────────────────────

async function makeBranch(name: string) {
  return await createBranch({ name })
}

async function makeMember(overrides: { branchId?: string | null } = {}) {
  return await createMember({
    documentNumber: `doc-${crypto.randomUUID().slice(0, 8)}`,
    ...overrides,
  })
}

async function assignBranch(memberId: string, branchId: string) {
  const [rel] = await db
    .insert(memberBranches)
    .values({ memberId, branchId })
    .returning()
  return rel
}

// ── 1. memberBranches CRUD ─────────────────────────────────────────

describe('memberBranches CRUD', () => {
  it('should assign a branch to a member', async () => {
    const branch = await makeBranch('CRUD Test A')
    const member = await makeMember()

    const rel = await assignBranch(member.id, branch.id)

    expect(rel).toBeDefined()
    expect(rel.memberId).toBe(member.id)
    expect(rel.branchId).toBe(branch.id)
  })

  it('should query branch assignments for a member', async () => {
    const branch1 = await makeBranch('CRUD Query 1')
    const branch2 = await makeBranch('CRUD Query 2')
    const member = await makeMember()

    await assignBranch(member.id, branch1.id)
    await assignBranch(member.id, branch2.id)

    const rows = await db.query.memberBranches.findMany({
      where: eq(memberBranches.memberId, member.id),
      with: { branch: { columns: { name: true } } },
    })

    expect(rows).toHaveLength(2)
    const names = rows.map((r) => r.branch.name).sort()
    expect(names).toEqual(['CRUD Query 1', 'CRUD Query 2'])
  })

  it('should enforce unique memberId + branchId constraint', async () => {
    const branch = await makeBranch('CRUD Unique')
    const member = await makeMember()

    await assignBranch(member.id, branch.id)

    await expect(
      assignBranch(member.id, branch.id),
    ).rejects.toThrow()
  })

  it('should delete assignments when member is deleted (cascade)', async () => {
    const branch = await makeBranch('CRUD Cascade')
    const member = await makeMember()

    await assignBranch(member.id, branch.id)

    // Delete the member
    await db
      .delete(members)
      .where(eq(members.id, member.id))

    const remaining = await db.query.memberBranches.findMany({
      where: eq(memberBranches.memberId, member.id),
    })

    expect(remaining).toHaveLength(0)
  })

  it('should replace all assignments via transactional delete+insert', async () => {
    const branches_list = await Promise.all([
      makeBranch('Replace A'),
      makeBranch('Replace B'),
      makeBranch('Replace C'),
    ])
    const member = await makeMember()

    // Assign to A and B
    await assignBranch(member.id, branches_list[0].id)
    await assignBranch(member.id, branches_list[1].id)

    // Replace with just C (simulates setMemberBranches transaction)
    await db.transaction(async (tx) => {
      await tx
        .delete(memberBranches)
        .where(eq(memberBranches.memberId, member.id))
      await tx
        .insert(memberBranches)
        .values({ memberId: member.id, branchId: branches_list[2].id })
    })

    const rows = await db.query.memberBranches.findMany({
      where: eq(memberBranches.memberId, member.id),
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].branchId).toBe(branches_list[2].id)
  })
})

// ── 2. canMemberAccessBranch ────────────────────────────────────────

describe('canMemberAccessBranch', () => {
  it('should return true if member primary branchId matches', async () => {
    const branch = await makeBranch('Access Primary')
    const member = await makeMember({ branchId: branch.id })

    const result = await canMemberAccessBranch(member.id, branch.id)

    expect(result).toBe(true)
  })

  it('should return true if member has junction table entry', async () => {
    const primaryBranch = await makeBranch('Access Primary')
    const extraBranch = await makeBranch('Access Extra')
    const member = await makeMember({ branchId: primaryBranch.id })

    await assignBranch(member.id, extraBranch.id)

    const result = await canMemberAccessBranch(member.id, extraBranch.id)

    expect(result).toBe(true)
  })

  it('should return true for shared members (null branchId, no memberBranches)', async () => {
    const branch = await makeBranch('Access Shared')
    const member = await makeMember({ branchId: null })

    const result = await canMemberAccessBranch(member.id, branch.id)

    expect(result).toBe(true)
  })

  it('should return false if member has no access', async () => {
    const branch1 = await makeBranch('Access Own')
    const branch2 = await makeBranch('Access Denied')
    const member = await makeMember({ branchId: branch1.id })

    const result = await canMemberAccessBranch(member.id, branch2.id)

    expect(result).toBe(false)
  })

  it('should return false for non-existent member', async () => {
    const branch = await makeBranch('Access No Member')
    const fakeId = '00000000-0000-0000-0000-000000000099'

    const result = await canMemberAccessBranch(fakeId, branch.id)

    expect(result).toBe(false)
  })

  it('should return false if member has extra branches but not target branch', async () => {
    const primary = await makeBranch('Access Primary')
    const extra = await makeBranch('Access Extra')
    const target = await makeBranch('Access Target')
    const member = await makeMember({ branchId: primary.id })

    // Assign to 'extra' but NOT 'target'
    await assignBranch(member.id, extra.id)

    const result = await canMemberAccessBranch(member.id, target.id)

    expect(result).toBe(false)
  })
})

// ── 3. findMembers multi-branch filter ──────────────────────────────

describe('findMembers multi-branch filter', () => {
  it('should find members belonging to a primary branch', async () => {
    const branch = await makeBranch('Find Primary')
    const member = await makeMember({ branchId: branch.id })

    const results = await findMembers({ branchId: branch.id })

    expect(results.some((m) => m.id === member.id)).toBe(true)
  })

  it('should find members via junction table', async () => {
    const primaryBranch = await makeBranch('Find Primary')
    const extraBranch = await makeBranch('Find Extra')
    const member = await makeMember({ branchId: primaryBranch.id })

    await assignBranch(member.id, extraBranch.id)

    const results = await findMembers({ branchId: extraBranch.id })

    expect(results.some((m) => m.id === member.id)).toBe(true)
  })

  it('should find shared members (null branchId, no extra branches)', async () => {
    const branch = await makeBranch('Find Shared')
    const member = await makeMember({ branchId: null })

    const results = await findMembers({ branchId: branch.id })

    expect(results.some((m) => m.id === member.id)).toBe(true)
  })

  it('should NOT find members that belong to another primary branch without extra access', async () => {
    const branchA = await makeBranch('Find BranchA')
    const branchB = await makeBranch('Find BranchB')
    const memberA = await makeMember({ branchId: branchA.id })

    const results = await findMembers({ branchId: branchB.id })

    expect(results.some((m) => m.id === memberA.id)).toBe(false)
  })

  it('should NOT find shared members that have extra branches (they are branch-specific)', async () => {
    const branchA = await makeBranch('Find BranchA')
    const branchB = await makeBranch('Find BranchB')
    const sharedMember = await makeMember({ branchId: null })

    // Give the shared member an extra branch assignment -> they are no longer "globally shared"
    await assignBranch(sharedMember.id, branchA.id)

    // Searching by branchB should NOT return them
    const results = await findMembers({ branchId: branchB.id })
    expect(results.some((m) => m.id === sharedMember.id)).toBe(false)

    // Searching by branchA SHOULD return them (via junction)
    const resultsA = await findMembers({ branchId: branchA.id })
    expect(resultsA.some((m) => m.id === sharedMember.id)).toBe(true)
  })

  it('should find multiple member types at once', async () => {
    const branch = await makeBranch('Find Combined')

    // Primary member
    const primary = await makeMember({ branchId: branch.id })

    // Junction member
    const otherBranch = await makeBranch('Other')
    const viaJunction = await makeMember({ branchId: otherBranch.id })
    await assignBranch(viaJunction.id, branch.id)

    // Shared member
    const shared = await makeMember({ branchId: null })

    const results = await findMembers({ branchId: branch.id })

    const resultIds = results.map((m) => m.id)
    expect(resultIds).toContain(primary.id)
    expect(resultIds).toContain(viaJunction.id)
    expect(resultIds).toContain(shared.id)
  })

  it('should return all members when branchId is not provided', async () => {
    const branchA = await makeBranch('Find All A')
    const branchB = await makeBranch('Find All B')
    const m1 = await makeMember({ branchId: branchA.id })
    const m2 = await makeMember({ branchId: branchB.id })
    const m3 = await makeMember({ branchId: null })

    const results = await findMembers({})

    const resultIds = results.map((m) => m.id)
    expect(resultIds).toContain(m1.id)
    expect(resultIds).toContain(m2.id)
    expect(resultIds).toContain(m3.id)
  })
})

// ── 4. getMemberIdsForBranch ────────────────────────────────────────

describe('getMemberIdsForBranch', () => {
  beforeEach(async () => {
    // Clean up all data these tests create, using cascade to handle FK chains
    await db.execute(sql`TRUNCATE TABLE "member_branches" CASCADE`)
    await db.execute(sql`TRUNCATE TABLE "branches" CASCADE`)
    await db.execute(sql`TRUNCATE TABLE "members" CASCADE`)
  })
  it('should return member IDs from primary branch', async () => {
    const branch = await makeBranch('Ids Primary')
    const member = await makeMember({ branchId: branch.id })

    const ids = await getMemberIdsForBranch(branch.id)

    expect(ids).toContain(member.id)
  })

  it('should return member IDs from junction table', async () => {
    const primaryBranch = await makeBranch('Ids Primary')
    const extraBranch = await makeBranch('Ids Extra')
    const member = await makeMember({ branchId: primaryBranch.id })

    await assignBranch(member.id, extraBranch.id)

    const ids = await getMemberIdsForBranch(extraBranch.id)

    expect(ids).toContain(member.id)
  })

  it('should include shared members (null branchId, no extra branches)', async () => {
    const branch = await makeBranch('Ids Shared')
    const member = await makeMember({ branchId: null })

    const ids = await getMemberIdsForBranch(branch.id)

    expect(ids).toContain(member.id)
  })

  it('should exclude shared members that have extra branches from unrelated branches', async () => {
    const branchA = await makeBranch('Ids BranchA')
    const branchB = await makeBranch('Ids BranchB')
    const shared = await makeMember({ branchId: null })

    // Assign them to branchA -> they are no longer globally shared
    await assignBranch(shared.id, branchA.id)

    // Should NOT appear in branchB's IDs
    const idsB = await getMemberIdsForBranch(branchB.id)
    expect(idsB).not.toContain(shared.id)

    // SHOULD appear in branchA's IDs (via junction)
    const idsA = await getMemberIdsForBranch(branchA.id)
    expect(idsA).toContain(shared.id)
  })

  it('should deduplicate member IDs', async () => {
    const branch = await makeBranch('Ids Dedup')
    const member = await makeMember({ branchId: branch.id })

    // Also add via junction (same member, same branch)
    await assignBranch(member.id, branch.id)

    const ids = await getMemberIdsForBranch(branch.id)

    // Member should appear only once
    const occurrences = ids.filter((id) => id === member.id).length
    expect(occurrences).toBe(1)
  })

  it('should return an empty array for a branch with no members', async () => {
    const branch = await makeBranch('Empty Branch')

    const ids = await getMemberIdsForBranch(branch.id)

    expect(ids).toHaveLength(0)
  })

  it('should combine different source types correctly', async () => {
    const branch = await makeBranch('Ids Combined')

    // Primary
    const primary = await makeMember({ branchId: branch.id })

    // Junction (from another branch)
    const otherBranch = await makeBranch('Other')
    const viaJunction = await makeMember({ branchId: otherBranch.id })
    await assignBranch(viaJunction.id, branch.id)

    // Shared
    const shared = await makeMember({ branchId: null })

    const ids = await getMemberIdsForBranch(branch.id)

    expect(ids).toHaveLength(3)
    expect(ids).toContain(primary.id)
    expect(ids).toContain(viaJunction.id)
    expect(ids).toContain(shared.id)
  })
})
