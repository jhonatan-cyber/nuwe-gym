import { faker } from '@faker-js/faker'
import { db } from '#/shared/db/index.ts'
import { eq } from 'drizzle-orm'
import { members } from '#/shared/db/schema/members.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { packages as packagesTable } from '#/shared/db/schema/packages.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { membershipPayments } from '#/shared/db/schema/membership-payments.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { products } from '#/shared/db/schema/products.ts'
import { productCategories } from '#/shared/db/schema/product-categories.ts'
import { suppliers } from '#/shared/db/schema/suppliers.ts'
import { purchases, purchaseItems } from '#/shared/db/schema/purchases.ts'
import { sales, saleItems } from '#/shared/db/schema/sales.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { classes, classSchedules } from '#/shared/db/schema/classes.ts'
import { cashRegisterSessions } from '#/shared/db/schema/cash-register.ts'
import { membershipFreezes } from '#/shared/db/schema/membership-freezes.ts'
import { branches } from '#/shared/db/schema/branches.ts'
import { notifications } from '#/shared/db/schema/notifications.ts'
import type { InferInsertModel } from 'drizzle-orm'

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function createTestUser(
  overrides: Partial<InferInsertModel<typeof users>> = {},
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, TEST_USER_ID))
    .limit(1)
  if (existing.length > 0) return existing[0]
  const [user] = await db
    .insert(users)
    .values({
      id: TEST_USER_ID,
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning()
  return user
}

function buildMember(
  overrides: Partial<InferInsertModel<typeof members>> = {},
) {
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    documentNumber: faker.string.alphanumeric(12),
    ...overrides,
  }
}

export async function createMember(
  overrides: Partial<InferInsertModel<typeof members>> = {},
) {
  const [member] = await db
    .insert(members)
    .values(buildMember(overrides))
    .returning()
  return member
}

export async function createPackage(
  overrides: Partial<InferInsertModel<typeof packagesTable>> = {},
) {
  const [pkg] = await db
    .insert(packagesTable)
    .values({
      name: 'Test Plan',
      price: '10000.00',
      durationDays: 30,
      ...overrides,
    })
    .returning()
  return pkg
}

export function buildSubscription(
  memberId: string,
  packageId: string,
  overrides: Partial<InferInsertModel<typeof subscriptions>> = {},
) {
  const startDate = faker.date.past()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 30)
  return {
    memberId,
    packageId,
    startDate,
    endDate,
    status: 'ACTIVE' as const,
    ...overrides,
  }
}

export async function createSubscription(
  memberId: string,
  packageId: string,
  overrides: Partial<InferInsertModel<typeof subscriptions>> = {},
) {
  const [sub] = await db
    .insert(subscriptions)
    .values(buildSubscription(memberId, packageId, overrides))
    .returning()
  return sub
}

export async function createCheckIn(
  memberId: string,
  overrides: Partial<InferInsertModel<typeof checkIns>> = {},
) {
  await createTestUser()
  const [checkIn] = await db
    .insert(checkIns)
    .values({
      memberId,
      checkedInAt: new Date(),
      registeredByUserId: TEST_USER_ID,
      resultStatus: 'ALLOWED',
      ...overrides,
    })
    .returning()
  return checkIn
}

export async function createCategory(
  overrides: Partial<InferInsertModel<typeof productCategories>> = {},
) {
  const [cat] = await db
    .insert(productCategories)
    .values({
      name: `${faker.commerce.department()} ${faker.string.alphanumeric(8)}`,
      ...overrides,
    })
    .returning()
  return cat
}

let cachedCategoryId: string | null = null
let cachedSupplierId: string | null = null
let cachedBranchId: string | null = null

async function defaultCategoryId(): Promise<string> {
  if (cachedCategoryId) return cachedCategoryId
  const [cat] = await db
    .insert(productCategories)
    .values({ name: 'cat_' + faker.string.alphanumeric(8) })
    .returning()
  cachedCategoryId = cat.id
  return cat.id
}

async function defaultSupplierId(): Promise<string> {
  if (cachedSupplierId) return cachedSupplierId
  const sup = await createSupplier()
  cachedSupplierId = sup.id
  return sup.id
}

async function defaultBranchId(): Promise<string> {
  if (cachedBranchId) return cachedBranchId
  const [branch] = await db
    .insert(branches)
    .values({ name: 'Default Branch' })
    .returning()
  cachedBranchId = branch.id
  return branch.id
}

export async function createProduct(
  overrides: Partial<InferInsertModel<typeof products>> = {},
) {
  const catId = await defaultCategoryId()
  const [product] = await db
    .insert(products)
    .values({
      name: faker.commerce.productName(),
      sku: faker.string.alphanumeric(8).toUpperCase(),
      categoryId: catId,
      salePrice: faker.commerce.price({ min: 500, max: 10000 }).toString(),
      ...overrides,
    })
    .returning()
  return product
}

export async function createSupplier(
  overrides: Partial<InferInsertModel<typeof suppliers>> = {},
) {
  const [supplier] = await db
    .insert(suppliers)
    .values({
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      ...overrides,
    })
    .returning()
  return supplier
}

export async function createPurchase(
  items: { productId: string; quantity: number; unitCost: string }[],
  overrides: Partial<InferInsertModel<typeof purchases>> = {},
) {
  await createTestUser()
  const subtotal = items
    .reduce((sum, item) => sum + Number(item.unitCost) * item.quantity, 0)
    .toFixed(2)
  const [purchase] = await db
    .insert(purchases)
    .values({
      supplierId: await defaultSupplierId(),
      purchaseNumber: faker.string.alphanumeric(8).toUpperCase(),
      subtotal,
      total: subtotal,
      createdByUserId: TEST_USER_ID,
      ...overrides,
    })
    .returning()

  for (const item of items) {
    const itemSubtotal = (Number(item.unitCost) * item.quantity).toFixed(2)
    await db.insert(purchaseItems).values({
      purchaseId: purchase.id,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: itemSubtotal,
    })
  }

  return purchase
}

export async function createSale(
  items: { productId: string; quantity: number; unitPrice: string }[],
  overrides: Partial<InferInsertModel<typeof sales>> = {},
) {
  await createTestUser()
  const [sale] = await db
    .insert(sales)
    .values({
      saleNumber: faker.string.alphanumeric(10).toUpperCase(),
      userId: TEST_USER_ID,
      subtotal: '0',
      total: items
        .reduce(
          (sum, i) => sum + Number.parseFloat(i.unitPrice) * i.quantity,
          0,
        )
        .toFixed(2),
      status: 'COMPLETED',
      ...overrides,
    })
    .returning()

  const saleItemsData = items.map((item) => ({
    saleId: sale.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: (Number.parseFloat(item.unitPrice) * item.quantity).toFixed(2),
  }))

  await db.insert(saleItems).values(saleItemsData)
  return { ...sale, items: saleItemsData }
}

export async function createClass(
  overrides: Partial<InferInsertModel<typeof classes>> = {},
) {
  const [cls] = await db
    .insert(classes)
    .values({
      name: faker.company.buzzNoun() + ' Class',
      description: faker.lorem.sentence(),
      capacity: faker.number.int({ min: 10, max: 30 }),
      color: faker.color.rgb(),
      ...overrides,
    })
    .returning()
  return cls
}

export async function createSchedule(
  classId: string,
  overrides: Partial<InferInsertModel<typeof classSchedules>> = {},
) {
  const [schedule] = await db
    .insert(classSchedules)
    .values({
      classId,
      dayOfWeek: faker.number.int({ min: 0, max: 6 }),
      startTime: '08:00',
      endTime: '09:00',
      ...overrides,
    })
    .returning()
  return schedule
}

export async function createCashRegisterSession(
  overrides: Partial<InferInsertModel<typeof cashRegisterSessions>> = {},
) {
  await createTestUser()
  const [session] = await db
    .insert(cashRegisterSessions)
    .values({
      branchId: await defaultBranchId(),
      openedByUserId: TEST_USER_ID,
      openingAmount: '0',
      status: 'OPEN',
      ...overrides,
    })
    .returning()
  return session
}

export async function createInventoryMovement(
  productId: string,
  overrides: Partial<InferInsertModel<typeof inventoryMovements>> = {},
) {
  const [movement] = await db
    .insert(inventoryMovements)
    .values({
      productId,
      quantity: faker.number.int({ min: 1, max: 50 }),
      movementType: 'PURCHASE',
      previousStock: faker.number.int({ min: 0, max: 100 }),
      newStock: faker.number.int({ min: 0, max: 100 }),
      createdByUserId: TEST_USER_ID,
      ...overrides,
    })
    .returning()
  return movement
}

export async function createMembershipPayment(
  subscriptionId: string,
  memberId: string,
  overrides: Partial<InferInsertModel<typeof membershipPayments>> = {},
) {
  await createTestUser()
  const [payment] = await db
    .insert(membershipPayments)
    .values({
      subscriptionId,
      memberId,
      amount: '10000.00',
      paymentMethod: 'CASH',
      createdByUserId: TEST_USER_ID,
      ...overrides,
    })
    .returning()
  return payment
}

export async function createBranch(
  overrides: Partial<InferInsertModel<typeof branches>> = {},
) {
  const [branch] = await db
    .insert(branches)
    .values({
      name: faker.company.name() + ' Sucursal',
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      ...overrides,
    })
    .returning()
  return branch
}

export async function createFreeze(
  subscriptionId: string,
  memberId: string,
  overrides: Partial<InferInsertModel<typeof membershipFreezes>> = {},
) {
  await createTestUser()
  const startDate = faker.date.past()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 15)
  const [freeze] = await db
    .insert(membershipFreezes)
    .values({
      subscriptionId,
      memberId,
      startDate,
      endDate,
      reason: faker.lorem.sentence(),
      ...overrides,
    })
    .returning()
  return freeze
}

export async function createNotification(
  overrides: Partial<InferInsertModel<typeof notifications>> = {},
) {
  await createTestUser()
  const [notification] = await db
    .insert(notifications)
    .values({
      type: 'SYSTEM',
      title: faker.lorem.sentence(4),
      message: faker.lorem.sentence(8),
      ...overrides,
    })
    .returning()
  return notification
}

export async function cleanDatabase() {
  await db.execute(
    `DO $$ DECLARE
       tbl TEXT;
     BEGIN
       FOR tbl IN
         SELECT tablename FROM pg_catalog.pg_tables
         WHERE schemaname = 'public' 
           AND tablename NOT IN ('drizzle_migrations', '__drizzle_migrations', 'roles')
       LOOP
         EXECUTE 'TRUNCATE TABLE ' || quote_ident(tbl) || ' CASCADE';
       END LOOP;
     END $$;`,
  )
  // Reset sequences
  await db.execute(
    `DO $$ DECLARE
       seq TEXT;
     BEGIN
       FOR seq IN
         SELECT sequence_name FROM information_schema.sequences
         WHERE sequence_schema = 'public'
       LOOP
         EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq) || ' RESTART WITH 1';
       END LOOP;
     END $$;`,
  )
}
