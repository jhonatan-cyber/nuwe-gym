import { describe, it, expect } from 'vitest'
import {
  createPackageSchema,
  updatePackageSchema,
  deletePackageSchema,
  packageItemSchema,
  allowedDaySchema,
  benefitSchema,
} from '#/features/packages/packages.schema.ts'

// ── packageItemSchema ──

describe('packageItemSchema', () => {
  it('accepts a minimal item', () => {
    const r = packageItemSchema.parse({ description: 'Acceso a pesas' })
    expect(r.description).toBe('Acceso a pesas')
    expect(r.sortOrder).toBeUndefined()
  })

  it('accepts an item with sort order', () => {
    const r = packageItemSchema.parse({ description: 'Cardio', sortOrder: 2 })
    expect(r.sortOrder).toBe(2)
  })

  it('rejects empty description', () => {
    expect(() =>
      packageItemSchema.parse({ description: '' }),
    ).toThrow()
  })

  it('rejects missing description', () => {
    expect(() => packageItemSchema.parse({})).toThrow()
  })
})

// ── allowedDaySchema ──

describe('allowedDaySchema', () => {
  it('accepts a minimal day entry', () => {
    const r = allowedDaySchema.parse({ dayOfWeek: 1 })
    expect(r.dayOfWeek).toBe(1)
  })

  it('accepts a full day entry with times', () => {
    const r = allowedDaySchema.parse({
      dayOfWeek: 3,
      startTime: '08:00',
      endTime: '22:00',
    })
    expect(r.startTime).toBe('08:00')
    expect(r.endTime).toBe('22:00')
  })

  it('accepts valid dayOfWeek 0 (Sunday)', () => {
    expect(allowedDaySchema.parse({ dayOfWeek: 0 }).dayOfWeek).toBe(0)
  })

  it('rejects invalid dayOfWeek (7)', () => {
    expect(() => allowedDaySchema.parse({ dayOfWeek: 7 })).toThrow()
  })

  it('rejects invalid dayOfWeek (8)', () => {
    expect(() => allowedDaySchema.parse({ dayOfWeek: 8 })).toThrow()
  })

  it('accepts valid dayOfWeek range (0-6)', () => {
    expect(allowedDaySchema.parse({ dayOfWeek: 0 }).dayOfWeek).toBe(0)
    expect(allowedDaySchema.parse({ dayOfWeek: 6 }).dayOfWeek).toBe(6)
  })

  it('rejects missing dayOfWeek', () => {
    expect(() => allowedDaySchema.parse({})).toThrow()
  })
})

// ── benefitSchema ──

describe('benefitSchema', () => {
  it('accepts a benefit with enabled set to true', () => {
    const r = benefitSchema.parse({ benefitKey: 'LOCKER', enabled: true })
    expect(r.enabled).toBe(true)
  })

  it('accepts a benefit with enabled set to false', () => {
    const r = benefitSchema.parse({ benefitKey: 'SAUNA', enabled: false })
    expect(r.enabled).toBe(false)
  })

  it('rejects missing benefitKey', () => {
    expect(() => benefitSchema.parse({ enabled: true })).toThrow()
  })

  it('rejects empty benefitKey', () => {
    expect(() =>
      benefitSchema.parse({ benefitKey: '', enabled: true }),
    ).toThrow()
  })

  it('rejects missing enabled', () => {
    expect(() =>
      benefitSchema.parse({ benefitKey: 'LOCKER' }),
    ).toThrow()
  })
})

// ── createPackageSchema ──

describe('createPackageSchema', () => {
  const MINIMAL = {
    name: 'Plan Básico',
    price: '5000.00',
    durationDays: 30,
  }

  it('accepts a minimal package', () => {
    const r = createPackageSchema.parse(MINIMAL)
    expect(r.name).toBe('Plan Básico')
    expect(r.price).toBe('5000.00')
    expect(r.durationDays).toBe(30)
    expect(r.type).toBe('PACKAGE')   // default
    expect(r.renewalType).toBe('MANUAL') // default
    expect(r.graceDays).toBe(0)      // default
    expect(r.items).toEqual([])      // default
  })

  it('accepts a full package with all fields', () => {
    const data = {
      ...MINIMAL,
      description: 'Plan completo',
      type: 'PROMOTION',
      renewalType: 'AUTO',
      graceDays: 5,
      maxFreezes: 2,
      maxFreezeDays: 30,
      allowedStartTime: '08:00',
      allowedEndTime: '22:00',
      dailyAccessLimit: 3,
      color: '#f59e0b',
      items: [{ description: 'Pesas', sortOrder: 1 }],
      allowedDays: [{ dayOfWeek: 1, startTime: '08:00', endTime: '22:00' }],
      benefits: [{ benefitKey: 'LOCKER', enabled: true }],
    }
    const r = createPackageSchema.parse(data)
    expect(r.type).toBe('PROMOTION')
    expect(r.renewalType).toBe('AUTO')
    expect(r.items).toHaveLength(1)
    expect(r.allowedDays).toHaveLength(1)
    expect(r.benefits).toHaveLength(1)
  })

  it('rejects negative durationDays', () => {
    expect(() =>
      createPackageSchema.parse({ ...MINIMAL, durationDays: -1 }),
    ).toThrow()
  })

  it('rejects zero durationDays', () => {
    expect(() =>
      createPackageSchema.parse({ ...MINIMAL, durationDays: 0 }),
    ).toThrow()
  })

  it('rejects invalid price format', () => {
    expect(() =>
      createPackageSchema.parse({ ...MINIMAL, price: 'abc' }),
    ).toThrow()
  })

  it('rejects missing price', () => {
    expect(() =>
      createPackageSchema.parse({ name: 'Test', durationDays: 30 }),
    ).toThrow()
  })

  it('rejects invalid type', () => {
    expect(() =>
      createPackageSchema.parse({ ...MINIMAL, type: 'INVALID' }),
    ).toThrow()
  })

  it('rejects invalid time format (startTime)', () => {
    expect(() =>
      createPackageSchema.parse({
        ...MINIMAL,
        allowedStartTime: '25:00',
      }),
    ).toThrow()
  })

  it('rejects negative maxFreezes', () => {
    expect(() =>
      createPackageSchema.parse({ ...MINIMAL, maxFreezes: -5 }),
    ).toThrow()
  })

  it('rejects invalid dayOfWeek in allowedDays', () => {
    expect(() =>
      createPackageSchema.parse({
        ...MINIMAL,
        allowedDays: [{ dayOfWeek: 7 }],
      }),
    ).toThrow()
  })

  it('accepts SPECIAL type package', () => {
    const r = createPackageSchema.parse({ ...MINIMAL, type: 'SPECIAL' })
    expect(r.type).toBe('SPECIAL')
  })
})

// ── updatePackageSchema ──

describe('updatePackageSchema', () => {
  const BASE = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Plan Actualizado',
    price: '7000.00',
    durationDays: 45,
    type: 'PACKAGE',
    isActive: true,
  }

  it('accepts a valid update payload', () => {
    const r = updatePackageSchema.parse(BASE)
    expect(r.name).toBe('Plan Actualizado')
    expect(r.isActive).toBe(true)
    expect(r.graceDays).toBe(0) // default
  })

  it('rejects missing id', () => {
    const { id: _, ...rest } = BASE
    expect(() => updatePackageSchema.parse(rest)).toThrow()
  })

  it('rejects invalid uuid', () => {
    expect(() =>
      updatePackageSchema.parse({ ...BASE, id: 'not-a-uuid' }),
    ).toThrow()
  })

  it('rejects missing isActive', () => {
    const { isActive: _, ...rest } = BASE
    expect(() => updatePackageSchema.parse(rest)).toThrow()
  })

  it('rejects missing type', () => {
    const { type: _, ...rest } = BASE
    expect(() => updatePackageSchema.parse(rest)).toThrow()
  })
})

// ── deletePackageSchema ──

describe('deletePackageSchema', () => {
  it('accepts a valid id', () => {
    const r = deletePackageSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(r.id).toBeDefined()
  })

  it('rejects invalid uuid', () => {
    expect(() => deletePackageSchema.parse({ id: 'bad-id' })).toThrow()
  })

  it('rejects missing id', () => {
    expect(() => deletePackageSchema.parse({})).toThrow()
  })
})
