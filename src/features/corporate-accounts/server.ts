import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { corporateAccounts } from '#/shared/db/schema/corporate-accounts.ts'
import { members } from '#/shared/db/schema/members.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { eq, desc, and, inArray, count, sum } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { uuidField, requiredString, optionalString } from '#/shared/lib/schemas.ts'

// ── CRUD ──

export const getCorporateAccounts = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requirePermission({ data: { permission: 'members:read' } })
    const accounts = await db
      .select()
      .from(corporateAccounts)
      .orderBy(desc(corporateAccounts.createdAt))

    // Enrich with employee count and active subscriptions count
    const enriched = await Promise.all(
      accounts.map(async (acct) => {
        const [{ cnt: employeeCount }] = await db
          .select({ cnt: count() })
          .from(members)
          .where(eq(members.corporateAccountId, acct.id))

        const accountMembers = await db
          .select({ id: members.id })
          .from(members)
          .where(eq(members.corporateAccountId, acct.id))

        let activeSubscriptions = 0
        if (accountMembers.length > 0) {
          const memberIds = accountMembers.map((m) => m.id)
          const [{ cnt }] = await db
            .select({ cnt: count() })
            .from(subscriptions)
            .where(
              and(
                inArray(subscriptions.memberId, memberIds),
                eq(subscriptions.status, 'ACTIVE'),
              ),
            )
          activeSubscriptions = Number(cnt)
        }

        return { ...acct, employeeCount, activeSubscriptions }
      }),
    )

    return enriched
  })

export const getCorporateAccountById = createServerFn({ method: 'GET' })
  .validator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    await requirePermission({ data: { permission: 'members:read' } })
    const [account] = await db
      .select()
      .from(corporateAccounts)
      .where(eq(corporateAccounts.id, id))
      .limit(1)
    if (!account) return null

    // Get employees (members) with their subscriptions
    const employees = await db.query.members.findMany({
      where: eq(members.corporateAccountId, id),
      with: {
        subscriptions: {
          with: {
            package: true,
          },
          orderBy: (s: any) => [desc(s.endDate)],
        },
      },
      orderBy: [desc(members.createdAt)],
    })

    return { ...account, employees }
  })

const createCorporateAccountSchema = z.object({
  companyName: requiredString,
  taxId: optionalString,
  address: optionalString,
  phone: optionalString,
  email: optionalString,
  contactPerson: optionalString,
  notes: optionalString,
  branchId: optionalString,
})

export const createCorporateAccount = createServerFn({ method: 'POST' })
  .validator((data) => createCorporateAccountSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })
    const [account] = await db
      .insert(corporateAccounts)
      .values({
        companyName: data.companyName,
        taxId: data.taxId ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        contactPerson: data.contactPerson ?? null,
        notes: data.notes ?? null,
        branchId: data.branchId ?? null,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'CORPORATE_ACCOUNT',
      entityId: account.id,
      description: `Creó cuenta corporativa ${account.companyName}`,
    })
    return account
  })

const updateCorporateAccountSchema = z.object({
  id: uuidField,
  companyName: requiredString,
  taxId: optionalString,
  address: optionalString,
  phone: optionalString,
  email: optionalString,
  contactPerson: optionalString,
  notes: optionalString,
  branchId: optionalString,
  isActive: z.boolean().optional(),
})

export const updateCorporateAccount = createServerFn({ method: 'POST' })
  .validator((data) => updateCorporateAccountSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })
    const [account] = await db
      .update(corporateAccounts)
      .set({
        companyName: data.companyName,
        taxId: data.taxId ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        contactPerson: data.contactPerson ?? null,
        notes: data.notes ?? null,
        branchId: data.branchId ?? null,
        isActive: data.isActive ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(corporateAccounts.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'CORPORATE_ACCOUNT',
      entityId: account.id,
      description: `Actualizó cuenta corporativa ${account.companyName}`,
    })
    return account
  })

export const deleteCorporateAccount = createServerFn({ method: 'POST' })
  .validator((data) => z.object({ id: uuidField }).parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'members:write' } })

    // Unlink members first
    await db
      .update(members)
      .set({ corporateAccountId: null, updatedAt: new Date() })
      .where(eq(members.corporateAccountId, data.id))

    const [deleted] = await db
      .delete(corporateAccounts)
      .where(eq(corporateAccounts.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'CORPORATE_ACCOUNT',
      entityId: data.id,
      description: `Eliminó cuenta corporativa ${deleted.companyName}`,
    })
    return deleted
  })

// ── Billing Report ──

export const getCorporateBillingReport = createServerFn({ method: 'GET' })
  .validator((data) => z.object({ corporateAccountId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'members:read' } })

    const accountMembers = await db
      .select({ id: members.id, fullName: members.fullName, documentNumber: members.documentNumber })
      .from(members)
      .where(eq(members.corporateAccountId, data.corporateAccountId))

    if (accountMembers.length === 0) {
      return { employees: [], totals: { totalEmployees: 0, totalSpent: 0, totalPayments: 0, avgPerMember: 0 } }
    }

    const memberIds = accountMembers.map((m) => m.id)

    // Get total payments from these members
    const paymentsResult = await db
      .select({
        total: sum(membershipPayments.amount),
        cnt: count(),
      })
      .from(membershipPayments)
      .where(
        inArray(membershipPayments.memberId, memberIds),
      )

    const totalSpent = parseFloat(paymentsResult[0]?.total ?? '0')
    const totalPayments = Number(paymentsResult[0]?.cnt ?? 0)

    return {
      employees: accountMembers,
      totals: {
        totalEmployees: accountMembers.length,
        totalSpent,
        totalPayments,
        avgPerMember: accountMembers.length > 0 ? totalSpent / accountMembers.length : 0,
      },
    }
  })
