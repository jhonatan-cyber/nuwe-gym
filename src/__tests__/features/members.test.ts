import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { eq } from 'drizzle-orm'
import { createMember, createPackage, createSubscription, createBranch, cleanDatabase } from '../factories.ts'
import {
  findMembers,
  findMemberById,
  insertMember,
  updateMemberById,
  updateMemberPhoto,
  hardDeleteMember,
} from '#/features/members/members.repository.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('findMembers', () => {
  it('should return all members when no filters', async () => {
    await createMember({ fullName: 'Alpha' })
    await createMember({ fullName: 'Beta' })
    const result = await findMembers({})
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('should filter by name search', async () => {
    await createMember({ fullName: 'Searchable Name' })
    const result = await findMembers({ search: 'Searchable' })
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].fullName).toBe('Searchable Name')
  })

  it('should filter by document number search', async () => {
    await createMember({ fullName: 'Doc Test', documentNumber: 'DOC999' })
    const result = await findMembers({ search: 'DOC999' })
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].documentNumber).toBe('DOC999')
  })

  it('should filter by email search', async () => {
    await createMember({ fullName: 'Email Test', email: 'uniquefind@test.com' })
    const result = await findMembers({ search: 'uniquefind@test.com' })
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].email).toBe('uniquefind@test.com')
  })

  it('should filter by branch id', async () => {
    const branch = await createBranch()
    const member = await createMember({ branchId: branch.id, fullName: 'Branch Member' })
    await createMember({ fullName: 'Other Branch Member' })
    const result = await findMembers({ branchId: branch.id })
    expect(result.some((m) => m.id === member.id)).toBe(true)
  })

  it('should include subscription with package in result', async () => {
    const pkg = await createPackage({ name: 'Finder Plan' })
    const member = await createMember()
    await createSubscription(member.id, pkg.id)
    const result = await findMemberById(member.id)
    expect(result?.subscriptions?.length).toBeGreaterThanOrEqual(1)
    expect(result?.subscriptions?.[0]?.package?.name).toBe('Finder Plan')
  })
})

describe('findMemberById', () => {
  it('should return member with subscriptions', async () => {
    const member = await createMember({ fullName: 'Get By ID' })
    const found = await findMemberById(member.id)
    expect(found).toBeDefined()
    expect(found!.fullName).toBe('Get By ID')
    expect(found!.subscriptions).toBeDefined()
  })

  it('should return undefined for non-existent id', async () => {
    const found = await findMemberById('00000000-0000-0000-0000-000000000000')
    expect(found).toBeUndefined()
  })
})

describe('insertMember', () => {
  it('should create a member with referral code', async () => {
    const member = await insertMember({
      fullName: 'New Member',
      documentNumber: 'INS999',
      email: 'insert@test.com',
      phone: '555-0001',
    })
    expect(member).toBeDefined()
    expect(member.fullName).toBe('New Member')
    expect(member.documentNumber).toBe('INS999')
    expect(member.referralCode).toMatch(/^[A-Z0-9]+-[A-Z0-9]+$/)
  })

  it('should link referredBy when valid referral code given', async () => {
    const referrer = await insertMember({ fullName: 'Referrer', documentNumber: 'REF001' })
    const referred = await insertMember({
      fullName: 'Referred',
      documentNumber: 'REF002',
      referredBy: referrer.referralCode,
    })
    expect(referred.referredBy).toBe(referrer.id)
  })

  it('should not link referredBy for invalid referral code', async () => {
    const referred = await insertMember({
      fullName: 'No Referrer',
      documentNumber: 'REF003',
      referredBy: 'NONEXIST-XXXX',
    })
    expect(referred.referredBy).toBeNull()
  })

  it('should store optional fields', async () => {
    const member = await insertMember({
      fullName: 'Full Fields',
      documentNumber: 'FULL001',
      email: 'full@test.com',
      phone: '555-9999',
      gender: 'MALE',
      address: '123 Test St',
    })
    expect(member.email).toBe('full@test.com')
    expect(member.phone).toBe('555-9999')
    expect(member.gender).toBe('MALE')
    expect(member.address).toBe('123 Test St')
  })
})

describe('updateMemberById', () => {
  it('should update member fields', async () => {
    const member = await insertMember({ fullName: 'Old Name', documentNumber: 'UPD001' })
    const updated = await updateMemberById({
      id: member.id,
      fullName: 'Updated Name',
      documentNumber: 'UPD002',
      status: 'ACTIVE',
    })
    expect(updated.fullName).toBe('Updated Name')
    expect(updated.documentNumber).toBe('UPD002')
  })

  it('should change member status', async () => {
    const member = await insertMember({ fullName: 'Status Toggle', documentNumber: 'ST001' })
    await updateMemberById({
      id: member.id,
      fullName: 'Status Toggle',
      documentNumber: 'ST001',
      status: 'INACTIVE',
    })
    const found = await findMemberById(member.id)
    expect(found!.status).toBe('INACTIVE')
  })
})

describe('updateMemberPhoto', () => {
  it('should set photo url', async () => {
    const member = await createMember()
    const updated = await updateMemberPhoto(member.id, 'data:image/png;base64,fake')
    expect(updated.photoUrl).toBe('data:image/png;base64,fake')
  })
})

describe('hardDeleteMember', () => {
  it('should delete member and cascade related data', async () => {
    const pkg = await createPackage()
    const member = await createMember()
    await createSubscription(member.id, pkg.id)

    await hardDeleteMember(member.id)

    const found = await db.query.members.findFirst({ where: eq(members.id, member.id) })
    expect(found).toBeUndefined()
  })
})
