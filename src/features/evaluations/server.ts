import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { memberEvaluations } from '#/shared/db/schema/member-evaluations.ts'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { uuidField, optionalString } from '#/shared/lib/schemas.ts'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'

const createEvaluationSchema = z.object({
  memberId: uuidField,
  evaluationDate: z.string().optional(),
  weightKg: z.string().optional(),
  chestCm: z.string().optional(),
  waistCm: z.string().optional(),
  hipsCm: z.string().optional(),
  leftArmCm: z.string().optional(),
  rightArmCm: z.string().optional(),
  leftThighCm: z.string().optional(),
  rightThighCm: z.string().optional(),
  pushUps: z.string().optional(),
  sitUps: z.string().optional(),
  pullUps: z.string().optional(),
  runMinutes: z.string().optional(),
  flexibilityCm: z.string().optional(),
  plankSeconds: z.string().optional(),
  notes: optionalString,
})

export type CreateEvaluationData = z.infer<typeof createEvaluationSchema>

export const createEvaluation = createServerFn({ method: 'POST' })
  .inputValidator((data) => createEvaluationSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'TRAINER'] },
    })

    const [evaluation] = await db
      .insert(memberEvaluations)
      .values({
        memberId: data.memberId,
        evaluatedById: session.user.id,
        ...(data.evaluationDate ? { evaluationDate: new Date(data.evaluationDate) } : {}),
        ...(data.weightKg ? { weightKg: data.weightKg } : {}),
        ...(data.chestCm ? { chestCm: data.chestCm } : {}),
        ...(data.waistCm ? { waistCm: data.waistCm } : {}),
        ...(data.hipsCm ? { hipsCm: data.hipsCm } : {}),
        ...(data.leftArmCm ? { leftArmCm: data.leftArmCm } : {}),
        ...(data.rightArmCm ? { rightArmCm: data.rightArmCm } : {}),
        ...(data.leftThighCm ? { leftThighCm: data.leftThighCm } : {}),
        ...(data.rightThighCm ? { rightThighCm: data.rightThighCm } : {}),
        ...(data.pushUps ? { pushUps: data.pushUps } : {}),
        ...(data.sitUps ? { sitUps: data.sitUps } : {}),
        ...(data.pullUps ? { pullUps: data.pullUps } : {}),
        ...(data.runMinutes ? { runMinutes: data.runMinutes } : {}),
        ...(data.flexibilityCm ? { flexibilityCm: data.flexibilityCm } : {}),
        ...(data.plankSeconds ? { plankSeconds: data.plankSeconds } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'EVALUATION',
      entityId: evaluation.id,
      description: `Registró evaluación física para socio ${data.memberId}`,
    })

    return evaluation
  })

export const getMemberEvaluations = createServerFn({ method: 'GET' })
  .inputValidator((memberId) => uuidField.parse(memberId))
  .handler(async ({ data: memberId }) => {
    await requireRole({ data: { roles: ['ADMIN', 'TRAINER', 'RECEPTIONIST'] } })

    return await db.query.memberEvaluations.findMany({
      where: eq(memberEvaluations.memberId, memberId),
      orderBy: [desc(memberEvaluations.evaluationDate)],
      with: { evaluatedBy: true },
    })
  })

export const deleteEvaluation = createServerFn({ method: 'POST' })
  .inputValidator((id) => uuidField.parse(id))
  .handler(async ({ data: id }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    await db.delete(memberEvaluations).where(eq(memberEvaluations.id, id))

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'EVALUATION',
      entityId: id,
      description: `Eliminó evaluación física #${id}`,
    })

    return { success: true }
  })
