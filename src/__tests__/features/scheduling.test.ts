import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { classes } from '#/shared/db/schema/classes.ts'
import { trainerProfiles, trainerAvailability } from '#/shared/db/schema/trainers.ts'
import { eq, desc } from 'drizzle-orm'
import {
  createClass,
  createSchedule,
  createTestUser,
  TEST_USER_ID,
  cleanDatabase,
} from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Classes', () => {
  it('should create a class and verify it exists', async () => {
    const cls = await createClass({
      name: 'Spinning',
      capacity: 20,
    })
    const found = await db.query.classes.findFirst({
      where: eq(classes.id, cls.id),
    })
    expect(found).toBeDefined()
    expect(found!.name).toBe('Spinning')
    expect(found!.capacity).toBe(20)
  })

  it('should create weekly schedules for a class', async () => {
    const cls = await createClass({ name: 'Yoga' })
    const schedule = await createSchedule(cls.id, {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
    })
    expect(schedule.classId).toBe(cls.id)
    expect(schedule.dayOfWeek).toBe(1)
    expect(schedule.startTime).toBe('09:00')
    expect(schedule.endTime).toBe('10:00')
  })

  it('should get class with its schedules', async () => {
    const cls = await createClass({ name: 'Crossfit' })
    await createSchedule(cls.id, { dayOfWeek: 1 })
    await createSchedule(cls.id, { dayOfWeek: 3 })
    await createSchedule(cls.id, { dayOfWeek: 5 })

    const found = await db.query.classes.findFirst({
      where: eq(classes.id, cls.id),
      with: { schedules: true },
    })
    expect(found!.schedules).toHaveLength(3)
    const days = found!.schedules.map((s) => s.dayOfWeek).sort()
    expect(days).toEqual([1, 3, 5])
  })

  it('should update class capacity', async () => {
    const cls = await createClass({ capacity: 15 })
    await db
      .update(classes)
      .set({ capacity: 30 })
      .where(eq(classes.id, cls.id))

    const updated = await db.query.classes.findFirst({
      where: eq(classes.id, cls.id),
    })
    expect(updated!.capacity).toBe(30)
  })

  it('should list all classes with schedules', async () => {
    const cls = await createClass({ name: 'Funcional' })
    await createSchedule(cls.id, { dayOfWeek: 2 })

    const all = await db.query.classes.findMany({
      with: { schedules: true },
      orderBy: [desc(classes.createdAt)],
    })
    expect(all.length).toBeGreaterThanOrEqual(1)
    const found = all.find((c) => c.name === 'Funcional')
    expect(found!.schedules.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Trainers', () => {
  it('should create a trainer profile', async () => {
    await createTestUser()
    const trainer = await db
      .insert(trainerProfiles)
      .values({ userId: TEST_USER_ID, specialty: 'Yoga', bio: 'Yoga instructor' })
      .returning()
      .then((r) => r[0])
    expect(trainer.userId).toBe(TEST_USER_ID)
    expect(trainer.specialty).toBe('Yoga')
  })

  it('should set trainer availability', async () => {
    const trainer = await db
      .insert(trainerProfiles)
      .values({ userId: TEST_USER_ID, specialty: 'Pilates', bio: 'Pilates instructor' })
      .returning()
      .then((r) => r[0])

    await db.insert(trainerAvailability).values([
      { trainerId: trainer.id, dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
      { trainerId: trainer.id, dayOfWeek: 3, startTime: '08:00', endTime: '12:00' },
      { trainerId: trainer.id, dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
    ])

    const availability = await db.query.trainerAvailability.findMany({
      where: eq(trainerAvailability.trainerId, trainer.id),
    })
    expect(availability).toHaveLength(3)
  })

  it('should get trainer profile with availability', async () => {
    const trainer = await db
      .insert(trainerProfiles)
      .values({ userId: TEST_USER_ID, specialty: 'Zumba', bio: 'Zumba instructor' })
      .returning()
      .then((r) => r[0])
    await db.insert(trainerAvailability).values([
      { trainerId: trainer.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    ])

    const profile = await db.query.trainerProfiles.findFirst({
      where: eq(trainerProfiles.id, trainer.id),
      with: { availability: true },
    })
    expect(profile).toBeDefined()
    expect(profile!.availability).toHaveLength(1)
    expect(profile!.availability[0].dayOfWeek).toBe(1)
    expect(profile!.availability[0].startTime).toBe('09:00')
  })

  it('should find trainers by specialization', async () => {
    await createTestUser()
    await db.insert(trainerProfiles).values([
      { userId: TEST_USER_ID, specialty: 'Yoga', bio: 'Profesor de yoga' },
      { userId: TEST_USER_ID, specialty: 'Musculación', bio: 'Entrenador de pesas' },
    ])

    const yogaTrainers = await db.query.trainerProfiles.findMany({
      where: (fields, { ilike }) => ilike(fields.specialty, '%Yoga%'),
    })
    expect(yogaTrainers.length).toBeGreaterThanOrEqual(1)
    expect(yogaTrainers[0].specialty).toBe('Yoga')
  })
})
