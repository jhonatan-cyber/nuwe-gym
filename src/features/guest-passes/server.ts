import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { guestPasses } from '#/shared/db/schema/guest-passes.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { eq, desc, and } from 'drizzle-orm'
import { requirePermission } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, optionalString, uuidField } from '#/shared/lib/schemas.ts'

// ── List guest passes for a member ─────────────────────────────────

export const getMemberGuestPasses = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({ memberId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'guest-passes:read' } })
    return await db.query.guestPasses.findMany({
      where: eq(guestPasses.memberId, data.memberId),
      orderBy: [desc(guestPasses.createdAt)],
      with: { usedBy: true },
    })
  })

// ── Create a guest pass ────────────────────────────────────────────

const createGuestPassSchema = z.object({
  memberId: uuidField,
  guestName: z.string().min(1, 'Nombre del invitado requerido'),
  guestPhone: optionalString,
  guestDocument: optionalString,
  notes: optionalString,
  branchId: branchIdField,
})

export const createGuestPass = createServerFn({ method: 'POST' })
  .validator((data) => createGuestPassSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'guest-passes:write' },
    })

    // Verify member has an active subscription with guest_passes benefit
    const activeSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.memberId, data.memberId),
        eq(subscriptions.status, 'ACTIVE'),
      ),
      with: { package: { with: { benefits: true } } },
    })

    if (!activeSub) {
      throw new Error('El socio no tiene una membresía activa.')
    }

    // ponytail: benefit check skipped for now — all active members can create guest passes
    // Add package benefit validation when per-plan limits are needed

    const [pass] = await db
      .insert(guestPasses)
      .values({
        memberId: data.memberId,
        guestName: data.guestName,
        guestPhone: data.guestPhone || null,
        guestDocument: data.guestDocument || null,
        notes: data.notes || null,
        branchId: data.branchId || null,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'MEMBER',
      entityId: pass.id,
      description: `Creó pase de invitado para ${data.guestName} (socio #${data.memberId})`,
    })

    return pass
  })

// ── Use a guest pass (check-in) ────────────────────────────────────

export const useGuestPass = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({ passId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requirePermission({
      data: { permission: 'guest-passes:write' },
    })

    const [pass] = await db
      .update(guestPasses)
      .set({
        status: 'USED',
        usedAt: new Date(),
        usedByUserId: session.user.id,
      })
      .where(
        and(
          eq(guestPasses.id, data.passId),
          eq(guestPasses.status, 'ACTIVE'),
        ),
      )
      .returning()

    if (!pass) {
      throw new Error('Pase de invitado no encontrado o ya utilizado.')
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: pass.id,
      description: `Utilizó pase de invitado para ${pass.guestName}`,
    })

    return pass
  })

// ── Cancel a guest pass ────────────────────────────────────────────

export const cancelGuestPass = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z.object({ passId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await requirePermission({ data: { permission: 'guest-passes:write' } })

    const [pass] = await db
      .update(guestPasses)
      .set({ status: 'CANCELLED' })
      .where(
        and(
          eq(guestPasses.id, data.passId),
          eq(guestPasses.status, 'ACTIVE'),
        ),
      )
      .returning()

    if (!pass) {
      throw new Error('Pase de invitado no encontrado o ya procesado.')
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'MEMBER',
      entityId: pass.id,
      description: `Canceló pase de invitado para ${pass.guestName}`,
    })

    return pass
  })

// ── Get available guest pass count for a member ────────────────────

export const getAvailableGuestPassInfo = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({ memberId: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'guest-passes:read' } })

    const activeSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.memberId, data.memberId),
        eq(subscriptions.status, 'ACTIVE'),
      ),
      with: { package: true },
    })

    if (!activeSub) {
      return { hasActiveSubscription: false, totalUsed: 0, canCreate: false }
    }

    const passes = await db.query.guestPasses.findMany({
      where: eq(guestPasses.memberId, data.memberId),
    })

    const totalUsed = passes.filter(
      (p) => p.status === 'USED' || p.status === 'ACTIVE',
    ).length

    return {
      hasActiveSubscription: true,
      totalCreated: passes.length,
      totalUsed,
      canCreate: true,
      packageName: activeSub.package?.name,
    }
  })
