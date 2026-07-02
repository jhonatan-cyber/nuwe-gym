import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { memberBranches } from '#/shared/db/schema/member-branches.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { membershipFreezes } from '#/shared/db/schema/membership-freezes.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { classBookings } from '#/shared/db/schema/classes.ts'
import { trainerAssignments } from '#/shared/db/schema/trainers.ts'
import { eq, and, or, desc, ilike, inArray, sql } from 'drizzle-orm'

export interface FindMembersOpts {
  search?: string
  branchId?: string
}

export async function findMembers(opts: FindMembersOpts) {
  const conditions: ReturnType<typeof eq>[] = []
  if (opts.search) {
    conditions.push(
      or(
        ilike(members.fullName, `%${opts.search}%`),
        ilike(members.documentNumber, `%${opts.search}%`),
        ilike(members.email, `%${opts.search}%`),
      ) as unknown as ReturnType<typeof eq>,
    )
  }
  if (opts.branchId) {
    // Multi-branch filter: primary branch match OR junction table match OR shared (no branchId + no memberBranches)
    const viaJunction = db
      .select({ memberId: memberBranches.memberId })
      .from(memberBranches)
      .where(eq(memberBranches.branchId, opts.branchId))

    // Get member IDs that have ANY entry in memberBranches (to exclude from shared)
    const allWithExtra = db
      .select({ memberId: memberBranches.memberId })
      .from(memberBranches)

    conditions.push(
      or(
        eq(members.branchId, opts.branchId),
        inArray(members.id, viaJunction),
        and(
          sql`${members.branchId} IS NULL`,
          sql`${members.id} NOT IN (${allWithExtra})`,
        ),
      ) as unknown as ReturnType<typeof eq>,
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  return await db.query.members.findMany({
    where: whereClause,
    orderBy: [desc(members.createdAt)],
    with: {
      branch: true,
      subscriptions: {
        where: (subscriptions) => eq(subscriptions.status, 'ACTIVE'),
        with: {
          package: true,
        },
      },
    },
  })
}

export async function findMemberById(id: string) {
  return await db.query.members.findFirst({
    where: eq(members.id, id),
    with: {
      subscriptions: {
        with: {
          package: true,
        },
        orderBy: (subscriptions) => [desc(subscriptions.endDate)],
      },
    },
  })
}

export interface CreateMemberData {
  fullName: string
  documentNumber: string
  email?: string | null
  phone?: string | null
  birthDate?: Date | null
  gender?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  address?: string | null
  branchId?: string | null
  corporateAccountId?: string | null
  physicalRestrictions?: string | null
  medicalNotes?: string | null
  contractSignature?: string | null
  referredBy?: string | null
}

export async function insertMember(data: CreateMemberData) {
  // Generate referral code
  const namePart = data.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
  const uid = crypto.randomUUID()

  let referredById: string | null = null
  if (data.referredBy) {
    const referrer = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.referralCode, data.referredBy.toUpperCase()))
      .limit(1)
      .then(r => r[0])
    if (referrer) referredById = referrer.id
  }

  const [member] = await db
    .insert(members)
    .values({
      fullName: data.fullName,
      documentNumber: data.documentNumber,
      email: data.email ?? null,
      phone: data.phone ?? null,
      birthDate: data.birthDate ?? null,
      gender: data.gender ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      address: data.address ?? null,
      branchId: data.branchId ?? null,
      physicalRestrictions: data.physicalRestrictions ?? null,
      medicalNotes: data.medicalNotes ?? null,
      contractSignature: data.contractSignature ?? null,
      corporateAccountId: data.corporateAccountId ?? null,
      referralCode: `${namePart}-${uid.slice(0, 6)}`.toUpperCase(),
      referredBy: referredById,
    })
    .returning()
  return member
}

export interface UpdateMemberData extends CreateMemberData {
  id: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELED'
}

export async function updateMemberById(data: UpdateMemberData) {
  const [member] = await db
    .update(members)
    .set({
      fullName: data.fullName,
      documentNumber: data.documentNumber,
      email: data.email,
      phone: data.phone,
      birthDate: data.birthDate,
      gender: data.gender,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      address: data.address,
      status: data.status,
      physicalRestrictions: data.physicalRestrictions,
      medicalNotes: data.medicalNotes,
      contractSignature: data.contractSignature,
      corporateAccountId: data.corporateAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(members.id, data.id))
    .returning()
  return member
}

export async function hardDeleteMember(id: string) {
  const rows = await db.transaction(async (tx) => {
    await tx.delete(membershipFreezes).where(eq(membershipFreezes.memberId, id))
    await tx.delete(membershipPayments).where(eq(membershipPayments.memberId, id))
    await tx.delete(classBookings).where(eq(classBookings.memberId, id))
    await tx.delete(checkIns).where(eq(checkIns.memberId, id))
    await tx.delete(trainerAssignments).where(eq(trainerAssignments.memberId, id))
    await tx.delete(subscriptions).where(eq(subscriptions.memberId, id))
    await tx.update(sales).set({ memberId: null }).where(eq(sales.memberId, id))
    return tx.delete(members).where(eq(members.id, id)).returning()
  })
  return rows[0]
}

export async function updateMemberPhoto(memberId: string, photoBase64: string) {
  const [member] = await db
    .update(members)
    .set({ photoUrl: photoBase64, updatedAt: new Date() })
    .where(eq(members.id, memberId))
    .returning()
  return member
}
