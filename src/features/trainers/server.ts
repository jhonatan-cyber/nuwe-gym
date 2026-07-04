import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { users } from '#/shared/db/schema/auth.ts'
import {
  trainerProfiles,
  trainerAssignments,
  trainerAvailability,
  trainerObservations,
} from '#/shared/db/schema/trainers.ts'
import { eq, desc, and } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { branchIdField, dayOfWeek, optionalString, requiredString, uuidField } from '#/shared/lib/schemas.ts'

export const getTrainers = createServerFn({ method: 'GET' })
  .validator(
    z.object({ branchId: branchIdField }).optional(),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const trainers = await db.query.trainerProfiles.findMany({
      where: data?.branchId
        ? eq(trainerProfiles.branchId, data.branchId)
        : undefined,
      with: {
        user: true,
        assignments: {
          where: eq(trainerAssignments.isActive, true),
          with: { member: true },
        },
      },
      orderBy: [desc(trainerProfiles.createdAt)],
    })
    return trainers.map((t) => ({
      ...t,
      memberCount: t.assignments.length,
    }))
  })

export const getTrainer = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z.object({ id: uuidField }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return await db.query.trainerProfiles.findFirst({
      where: eq(trainerProfiles.id, data.id),
      with: {
        user: true,
        availability: true,
        assignments: {
          where: eq(trainerAssignments.isActive, true),
          with: { member: true },
        },
      },
    })
  })

const createTrainerSchema = z.object({
  userId: requiredString,
  branchId: branchIdField,
  specialty: z.string().optional(),
  bio: z.string().optional(),
  commissionRate: z.string().optional(),
})

export const createTrainer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createTrainerSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const user = await db.query.users.findFirst({
      where: eq(users.id, data.userId),
    })
    if (!user) throw new Error('Usuario no encontrado')

    const [profile] = await db
      .insert(trainerProfiles)
      .values({
        userId: data.userId,
        branchId: data.branchId ?? null,
        specialty: data.specialty ?? '',
        bio: data.bio ?? '',
        commissionRate: data.commissionRate ?? '0',
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'TRAINER',
      entityId: profile.id,
      description: `Creó entrenador ${user.name}`,
    })

    return profile
  })

const updateTrainerSchema = z.object({
  id: uuidField,
  specialty: optionalString,
  bio: optionalString,
  commissionRate: optionalString,
  isActive: z.boolean().optional(),
})

export const updateTrainer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateTrainerSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [profile] = await db
      .update(trainerProfiles)
      .set({
        specialty: data.specialty,
        bio: data.bio,
        commissionRate: data.commissionRate,
        isActive: data.isActive,
      })
      .where(eq(trainerProfiles.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'TRAINER',
      entityId: profile.id,
      description: `Actualizó entrenador #${profile.id}`,
    })
    return profile
  })

const assignMemberSchema = z.object({
  trainerId: uuidField,
  memberId: uuidField,
})

export const assignMember = createServerFn({ method: 'POST' })
  .validator((data: unknown) => assignMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    const existing = await db.query.trainerAssignments.findFirst({
      where: and(
        eq(trainerAssignments.trainerId, data.trainerId),
        eq(trainerAssignments.memberId, data.memberId),
        eq(trainerAssignments.isActive, true),
      ),
    })
    if (existing) throw new Error('El socio ya está asignado a este entrenador')

    const [assignment] = await db
      .insert(trainerAssignments)
      .values({
        trainerId: data.trainerId,
        memberId: data.memberId,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'TRAINER',
      entityId: assignment.id,
      description: `Asignó socio #${data.memberId} a entrenador #${data.trainerId}`,
    })

    return assignment
  })

const unassignMemberSchema = z.object({ id: uuidField })

export const unassignMember = createServerFn({ method: 'POST' })
  .validator((data: unknown) => unassignMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })
    const [assignment] = await db
      .update(trainerAssignments)
      .set({ isActive: false })
      .where(eq(trainerAssignments.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'TRAINER',
      entityId: assignment.id,
      description: `Desasignó socio de entrenador #${assignment.trainerId}`,
    })
    return assignment
  })

const availabilitySlotSchema = z.object({
  dayOfWeek: dayOfWeek,
  startTime: z.string(),
  endTime: z.string(),
})

const setAvailabilitySchema = z.object({
  trainerId: uuidField,
  slots: z.array(availabilitySlotSchema),
})

export const setAvailability = createServerFn({ method: 'POST' })
  .validator((data: unknown) => setAvailabilitySchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN'] } })

    await db
      .delete(trainerAvailability)
      .where(eq(trainerAvailability.trainerId, data.trainerId))

    if (data.slots.length > 0) {
      await db.insert(trainerAvailability).values(
        data.slots.map((slot: any) => ({
          trainerId: data.trainerId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      )
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'TRAINER',
      entityId: data.trainerId,
      description: `Actualizó disponibilidad de entrenador #${data.trainerId}`,
    })

    return await db.query.trainerAvailability.findMany({
      where: eq(trainerAvailability.trainerId, data.trainerId),
    })
  })

export const getMyMembers = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireRole({ data: { roles: ['TRAINER'] } })

    const profile = await db.query.trainerProfiles.findFirst({
      where: eq(trainerProfiles.userId, session.user.id),
    })
    if (!profile) return []

    const assignments = await db.query.trainerAssignments.findMany({
      where: and(
        eq(trainerAssignments.trainerId, profile.id),
        eq(trainerAssignments.isActive, true),
      ),
      with: { member: true },
    })

    return assignments.map((a) => a.member)
  },
)

export const getTrainerDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireRole({ data: { roles: ['TRAINER'] } })

    const profile = await db.query.trainerProfiles.findFirst({
      where: eq(trainerProfiles.userId, session.user.id),
      with: {
        assignments: {
          where: eq(trainerAssignments.isActive, true),
          with: { member: true },
        },
      },
    })

    return {
      memberCount: profile?.assignments.length ?? 0,
      assignedMembers: profile?.assignments.map((a) => a.member) ?? [],
    }
  },
)

export const getTrainerUsers = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    return await db.query.users.findMany({
      where: eq(users.role, 'TRAINER'),
    })
  },
)

const generateAIRoutineSchema = z.object({
  age: z.number(),
  gender: z.string(),
  objectives: z.string(),
  experienceLevel: z.string(),
  weeklyDays: z.number(),
  limitations: optionalString,
})

export const generateAIRoutine = createServerFn({ method: 'POST' })
  .validator((data: unknown) => generateAIRoutineSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'TRAINER'] } })
    const { generateRoutineProposal } = await import('./routine-generator.ts')
    return await generateRoutineProposal(data)
  })

// --- Trainer Observations ---

export const getTrainerSchedule = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    const trainers = await db.query.trainerProfiles.findMany({
      where: eq(trainerProfiles.isActive, true),
      with: {
        user: true,
        availability: true,
        assignments: {
          where: eq(trainerAssignments.isActive, true),
          with: { member: true },
        },
      },
      orderBy: [trainerProfiles.createdAt],
    })
    return trainers.map((t) => ({
      id: t.id,
      name: t.user.name,
      specialty: t.specialty,
      availability: t.availability,
      memberCount: t.assignments.length,
    }))
  })

export const getTrainerObservations = createServerFn({ method: 'GET' })
  .validator(z.object({ memberId: uuidField }))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'TRAINER'] } })

    const profile = session.user.role === 'TRAINER'
      ? await db.query.trainerProfiles.findFirst({
          where: eq(trainerProfiles.userId, session.user.id),
        })
      : null

    return await db.query.trainerObservations.findMany({
      where: profile
        ? and(
            eq(trainerObservations.memberId, data.memberId),
            eq(trainerObservations.trainerId, profile.id),
          )
        : eq(trainerObservations.memberId, data.memberId),
      orderBy: [desc(trainerObservations.createdAt)],
    })
  })

const createObservationSchema = z.object({
  memberId: uuidField,
  note: requiredString,
})

export const createTrainerObservation = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createObservationSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['TRAINER'] } })

    const profile = await db.query.trainerProfiles.findFirst({
      where: eq(trainerProfiles.userId, session.user.id),
    })
    if (!profile) throw new Error('Perfil de entrenador no encontrado')

    const [obs] = await db
      .insert(trainerObservations)
      .values({
        trainerId: profile.id,
        memberId: data.memberId,
        note: data.note,
      })
      .returning()

    return obs
  })
