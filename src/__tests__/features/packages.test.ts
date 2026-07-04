import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { packages, packageItems, packageAllowedDays, packageBenefits } from '#/shared/db/schema/packages.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { eq } from 'drizzle-orm'
import { createMember, cleanDatabase } from '../factories.ts'
import {
  findAll,
  findActive,
  insert,
  update,
  remove,
  replacePackageItems,
  replaceAllowedDays,
  replacePackageBenefits,
  hasSubscriptions,
} from '#/features/packages/packages.repository.ts'

beforeAll(async () => {
  await cleanDatabase()
})

// ── Create ─────────────────────────────────────────────────────────

describe('Package CRUD', () => {
  it('should create a basic package', async () => {
    const pkg = await insert({
      name: 'Plan Básico',
      price: '5000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    expect(pkg).toBeDefined()
    expect(pkg.name).toBe('Plan Básico')
    expect(pkg.price).toBe('5000.00')
    expect(pkg.durationDays).toBe(30)
    expect(pkg.type).toBe('PACKAGE')
    expect(pkg.isActive).toBe(true)
  })

  it('should create a package with all optional fields', async () => {
    const pkg = await insert({
      name: 'Plan Premium',
      description: 'Acceso completo',
      price: '15000.00',
      durationDays: 90,
      type: 'PACKAGE',
      renewalType: 'AUTO',
      graceDays: 3,
      maxFreezes: 2,
      maxFreezeDays: 30,
      allowedStartTime: '08:00',
      allowedEndTime: '22:00',
      dailyAccessLimit: 2,
      color: '#f59e0b',
      imageBase64: 'data:image/png;base64,abc123',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    expect(pkg.description).toBe('Acceso completo')
    expect(pkg.renewalType).toBe('AUTO')
    expect(pkg.graceDays).toBe(3)
    expect(pkg.maxFreezes).toBe(2)
    expect(pkg.dailyAccessLimit).toBe(2)
    expect(pkg.color).toBe('#f59e0b')
  })

  it('should create a PROMOTION type package', async () => {
    const pkg = await insert({
      name: 'Promo Verano',
      price: '8000.00',
      durationDays: 60,
      type: 'PROMOTION',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    expect(pkg.type).toBe('PROMOTION')
  })
})

// ── Read (findAll / findActive) ───────────────────────────────────

describe('Package Queries', () => {
  it('should find all packages ordered by creation date desc', async () => {
    const all = await findAll()
    expect(all.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < all.length; i++) {
      expect(
        new Date(all[i - 1].createdAt).getTime(),
      ).toBeGreaterThanOrEqual(new Date(all[i].createdAt).getTime())
    }
    // Each package should include relations
    all.forEach((p) => {
      expect(Array.isArray(p.items)).toBe(true)
      expect(Array.isArray(p.allowedDays)).toBe(true)
      expect(Array.isArray(p.benefits)).toBe(true)
    })
  })

  it('should find only active packages', async () => {
    // Create an inactive package
    await insert({
      name: 'Plan Inactivo',
      price: '3000.00',
      durationDays: 15,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })
    const [createdInactive] = await db
      .select()
      .from(packages)
      .where(eq(packages.name, 'Plan Inactivo'))
      .limit(1)

    // Deactivate it directly
    await db
      .update(packages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(packages.id, createdInactive.id))

    const active = await findActive()
    expect(active.length).toBeGreaterThanOrEqual(2)
    active.forEach((p) => expect(p.isActive).toBe(true))
  })
})

// ── Update ─────────────────────────────────────────────────────────

describe('Package Update', () => {
  it('should update package fields', async () => {
    const pkg = await insert({
      name: 'Plan Original',
      price: '5000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    const updated = await update(pkg.id, {
      id: pkg.id,
      name: 'Plan Modificado',
      price: '6000.00',
      durationDays: 45,
      type: 'PACKAGE',
      isActive: true,
      items: [],
      allowedDays: [],
      benefits: [],
    })

    expect(updated.name).toBe('Plan Modificado')
    expect(updated.price).toBe('6000.00')
    expect(updated.durationDays).toBe(45)
  })

  it('should deactivate and reactivate a package', async () => {
    const pkg = await insert({
      name: 'Plan Toggle',
      price: '4000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    const deactivated = await update(pkg.id, {
      id: pkg.id,
      name: 'Plan Toggle',
      price: '4000.00',
      durationDays: 30,
      type: 'PACKAGE',
      isActive: false,
      items: [],
      allowedDays: [],
      benefits: [],
    })
    expect(deactivated.isActive).toBe(false)

    const reactivated = await update(pkg.id, {
      id: pkg.id,
      name: 'Plan Toggle',
      price: '4000.00',
      durationDays: 30,
      type: 'PACKAGE',
      isActive: true,
      items: [],
      allowedDays: [],
      benefits: [],
    })
    expect(reactivated.isActive).toBe(true)
  })
})

// ── Delete ─────────────────────────────────────────────────────────

describe('Package Delete', () => {
  it('should delete a package with no subscriptions', async () => {
    const pkg = await insert({
      name: 'Plan Eliminar',
      price: '2000.00',
      durationDays: 15,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    const hasSubs = await hasSubscriptions(pkg.id)
    expect(hasSubs).toBe(false)

    const deleted = await remove(pkg.id)
    expect(deleted.id).toBe(pkg.id)

    const found = await db.query.packages.findFirst({
      where: eq(packages.id, pkg.id),
    })
    expect(found).toBeUndefined()
  })

  it('should detect package with subscriptions', async () => {
    const pkg = await insert({
      name: 'Plan con Socios',
      price: '10000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })
    const member = await createMember()
    const [sub] = await db
      .insert(subscriptions)
      .values({
        memberId: member.id,
        packageId: pkg.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        status: 'ACTIVE',
      })
      .returning()
    expect(sub).toBeDefined()

    const hasSubs = await hasSubscriptions(pkg.id)
    expect(hasSubs).toBe(true)
  })


})

// ── Package Items ─────────────────────────────────────────────────

describe('Package Items', () => {
  it('should add items to a package', async () => {
    const pkg = await insert({
      name: 'Plan con Items',
      price: '7000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageItems(pkg.id, [
      { description: 'Acceso a pesas', sortOrder: 1 },
      { description: 'Acceso a cardio', sortOrder: 2 },
    ])

    const items = await db.query.packageItems.findMany({
      where: eq(packageItems.packageId, pkg.id),
      orderBy: [packageItems.sortOrder],
    })

    expect(items).toHaveLength(2)
    expect(items[0].description).toBe('Acceso a pesas')
    expect(items[0].sortOrder).toBe(1)
  })

  it('should replace items (delete old, insert new)', async () => {
    const pkg = await insert({
      name: 'Plan Reemplazo Items',
      price: '8000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageItems(pkg.id, [
      { description: 'Item viejo' },
    ])

    await replacePackageItems(pkg.id, [
      { description: 'Item nuevo A' },
      { description: 'Item nuevo B' },
    ])

    const items = await db.query.packageItems.findMany({
      where: eq(packageItems.packageId, pkg.id),
    })

    expect(items).toHaveLength(2)
    expect(items.find((i) => i.description === 'Item viejo')).toBeUndefined()
    expect(items.find((i) => i.description === 'Item nuevo A')).toBeDefined()
  })

  it('should cascade delete items when package is deleted', async () => {
    const pkg = await insert({
      name: 'Plan Cascade Items',
      price: '6000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })
    await replacePackageItems(pkg.id, [
      { description: 'Item a eliminar' },
    ])

    await remove(pkg.id)

    const items = await db.query.packageItems.findMany({
      where: eq(packageItems.packageId, pkg.id),
    })
    expect(items).toHaveLength(0)
  })
})

// ── Package Allowed Days ──────────────────────────────────────────

describe('Package Allowed Days', () => {
  it('should add allowed days to a package', async () => {
    const pkg = await insert({
      name: 'Plan Horarios',
      price: '5500.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replaceAllowedDays(pkg.id, [
      { dayOfWeek: 1, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '22:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
    ])

    const days = await db.query.packageAllowedDays.findMany({
      where: eq(packageAllowedDays.packageId, pkg.id),
      orderBy: [packageAllowedDays.dayOfWeek],
    })

    expect(days).toHaveLength(3)
    expect(days[0].dayOfWeek).toBe(1)
    expect(days[0].startTime).toBe('08:00')
  })

  it('should replace allowed days', async () => {
    const pkg = await insert({
      name: 'Plan Reemplazo Dias',
      price: '5500.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replaceAllowedDays(pkg.id, [
      { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
    ])

    await replaceAllowedDays(pkg.id, [
      { dayOfWeek: 2, startTime: '14:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '22:00' },
    ])

    const days = await db.query.packageAllowedDays.findMany({
      where: eq(packageAllowedDays.packageId, pkg.id),
    })

    expect(days).toHaveLength(2)
    expect(days.find((d) => d.dayOfWeek === 1)).toBeUndefined()
    expect(days.find((d) => d.dayOfWeek === 2)).toBeDefined()
  })
})

// ── Package Benefits ──────────────────────────────────────────────

describe('Package Benefits', () => {
  it('should add benefits to a package', async () => {
    const pkg = await insert({
      name: 'Plan Beneficios',
      price: '9000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageBenefits(pkg.id, [
      { benefitKey: 'LOCKER', enabled: true },
      { benefitKey: 'PARKING', enabled: true },
      { benefitKey: 'SAUNA', enabled: false },
    ])

    const benefits = await db.query.packageBenefits.findMany({
      where: eq(packageBenefits.packageId, pkg.id),
    })

    expect(benefits).toHaveLength(3)
    expect(benefits.find((b) => b.benefitKey === 'LOCKER')!.enabled).toBe(true)
    expect(benefits.find((b) => b.benefitKey === 'SAUNA')!.enabled).toBe(false)
  })

  it('should replace benefits (delete old, insert new)', async () => {
    const pkg = await insert({
      name: 'Plan Reemplazo Beneficios',
      price: '9000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageBenefits(pkg.id, [
      { benefitKey: 'OLD_BENEFIT', enabled: true },
    ])

    await replacePackageBenefits(pkg.id, [
      { benefitKey: 'NEW_BENEFIT_A', enabled: true },
      { benefitKey: 'NEW_BENEFIT_B', enabled: false },
    ])

    const benefits = await db.query.packageBenefits.findMany({
      where: eq(packageBenefits.packageId, pkg.id),
    })

    expect(benefits).toHaveLength(2)
    expect(benefits.find((b) => b.benefitKey === 'OLD_BENEFIT')).toBeUndefined()
  })

  it('should enforce unique benefitKey per package', async () => {
    const pkg = await insert({
      name: 'Plan Unique Benefit',
      price: '7000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageBenefits(pkg.id, [
      { benefitKey: 'UNIQUE', enabled: true },
    ])

    // Try to insert duplicate benefitKey directly (bypasses replace which does delete+insert)
    await expect(
      db.insert(packageBenefits).values({
        packageId: pkg.id,
        benefitKey: 'UNIQUE',
        enabled: true,
      }),
    ).rejects.toThrow()
  })
})

// ── Full Package Lifecycle ────────────────────────────────────────

describe('Package Lifecycle', () => {
  it('should create a full package with items, days, and benefits', async () => {
    const pkg = await insert({
      name: 'Plan Full Lifecycle',
      price: '12000.00',
      durationDays: 30,
      type: 'PACKAGE',
      renewalType: 'AUTO',
      graceDays: 5,
      maxFreezes: 3,
      maxFreezeDays: 45,
      allowedStartTime: '06:00',
      allowedEndTime: '23:00',
      dailyAccessLimit: 3,
      color: '#10b981',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageItems(pkg.id, [
      { description: 'Pesas libres', sortOrder: 1 },
      { description: 'Maquinas cardiovasculares', sortOrder: 2 },
      { description: 'Clases grupales', sortOrder: 3 },
    ])

    await replaceAllowedDays(pkg.id, [
      { dayOfWeek: 1, startTime: '06:00', endTime: '23:00' },
      { dayOfWeek: 2, startTime: '06:00', endTime: '23:00' },
      { dayOfWeek: 3, startTime: '06:00', endTime: '23:00' },
      { dayOfWeek: 4, startTime: '06:00', endTime: '23:00' },
      { dayOfWeek: 5, startTime: '06:00', endTime: '23:00' },
    ])

    await replacePackageBenefits(pkg.id, [
      { benefitKey: 'LOCKER', enabled: true },
      { benefitKey: 'PARKING', enabled: false },
    ])

    const full = await db.query.packages.findFirst({
      where: eq(packages.id, pkg.id),
      with: { items: true, allowedDays: true, benefits: true },
    })

    expect(full).toBeDefined()
    expect(full!.items).toHaveLength(3)
    expect(full!.allowedDays).toHaveLength(5)
    expect(full!.benefits).toHaveLength(2)
  })

  it('should update package and replace all sub-resources', async () => {
    const pkg = await insert({
      name: 'Plan Update Full',
      price: '10000.00',
      durationDays: 30,
      type: 'PACKAGE',
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageItems(pkg.id, [
      { description: 'Item original' },
    ])
    await replacePackageBenefits(pkg.id, [
      { benefitKey: 'BENEFIT_ORIG', enabled: true },
    ])

    // Update and replace
    await update(pkg.id, {
      id: pkg.id,
      name: 'Plan Update Full (Modificado)',
      price: '11000.00',
      durationDays: 60,
      type: 'PACKAGE',
      isActive: true,
      items: [],
      allowedDays: [],
      benefits: [],
    })

    await replacePackageItems(pkg.id, [
      { description: 'Item nuevo' },
    ])
    await replacePackageBenefits(pkg.id, [
      { benefitKey: 'BENEFIT_NEW', enabled: false },
    ])

    const result = await db.query.packages.findFirst({
      where: eq(packages.id, pkg.id),
      with: { items: true, benefits: true },
    })

    expect(result!.name).toBe('Plan Update Full (Modificado)')
    expect(result!.price).toBe('11000.00')
    expect(result!.items).toHaveLength(1)
    expect(result!.items[0].description).toBe('Item nuevo')
    expect(result!.benefits).toHaveLength(1)
    expect(result!.benefits[0].benefitKey).toBe('BENEFIT_NEW')
  })
})
