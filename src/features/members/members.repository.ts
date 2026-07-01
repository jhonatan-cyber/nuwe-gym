import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { membershipFreezes } from '#/shared/db/schema/membership-freezes.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { sales } from '#/shared/db/schema/sales.ts'
import { classBookings } from '#/shared/db/schema/classes.ts'
import { trainerAssignments } from '#/shared/db/schema/trainers.ts'
import { eq, and, or, desc, ilike } from 'drizzle-orm'

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
    conditions.push(eq(members.branchId, opts.branchId))
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
  physicalRestrictions?: string | null
  medicalNotes?: string | null
  contractSignature?: string | null
}

export async function insertMember(data: CreateMemberData) {
  const [member] = await db.insert(members).values(data).returning()
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
