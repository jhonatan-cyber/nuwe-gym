import { db } from '#/shared/db/index.ts'
import {
  packages,
  packageItems,
  packageAllowedDays,
} from '#/shared/db/schema/packages.ts'
import { subscriptions } from '#/shared/db/schema/subscriptions.ts'
import { eq, desc } from 'drizzle-orm'
import type { CreatePackageInput, UpdatePackageInput } from './packages.schema.ts'

export function findAll() {
  return db.query.packages.findMany({
    with: { items: true, allowedDays: true },
    orderBy: [desc(packages.createdAt)],
  })
}

export function findActive() {
  return db.query.packages.findMany({
    where: eq(packages.isActive, true),
    with: { items: true, allowedDays: true },
    orderBy: [desc(packages.createdAt)],
  })
}

export async function insert(data: CreatePackageInput) {
  const [pkg] = await db
    .insert(packages)
    .values({
      name: data.name,
      description: data.description,
      imageBase64: data.imageBase64,
      price: data.price,
      durationDays: data.durationDays,
      type: data.type,
      renewalType: data.renewalType,
      graceDays: data.graceDays,
      maxFreezes: data.maxFreezes,
      maxFreezeDays: data.maxFreezeDays,
      allowedStartTime: data.allowedStartTime,
      allowedEndTime: data.allowedEndTime,
      dailyAccessLimit: data.dailyAccessLimit,
      color: data.color,
    })
    .returning()
  return pkg
}

export async function update(id: string, data: UpdatePackageInput) {
  const [pkg] = await db
    .update(packages)
    .set({
      name: data.name,
      description: data.description,
      imageBase64: data.imageBase64,
      price: data.price,
      durationDays: data.durationDays,
      type: data.type,
      renewalType: data.renewalType,
      graceDays: data.graceDays,
      maxFreezes: data.maxFreezes,
      maxFreezeDays: data.maxFreezeDays,
      allowedStartTime: data.allowedStartTime,
      allowedEndTime: data.allowedEndTime,
      dailyAccessLimit: data.dailyAccessLimit,
      color: data.color,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(packages.id, id))
    .returning()
  return pkg
}

export async function remove(id: string) {
  const [pkg] = await db
    .delete(packages)
    .where(eq(packages.id, id))
    .returning()
  return pkg
}

// --- Sub-resources ---

export async function replacePackageItems(
  packageId: string,
  items: { description: string; sortOrder?: number }[],
) {
  await db.delete(packageItems).where(eq(packageItems.packageId, packageId))
  if (items.length > 0) {
    await db.insert(packageItems).values(
      items.map((item, idx) => ({
        packageId,
        description: item.description,
        sortOrder: item.sortOrder ?? idx,
      })),
    )
  }
}

export async function replaceAllowedDays(
  packageId: string,
  days: { dayOfWeek: number; startTime?: string; endTime?: string }[],
) {
  await db
    .delete(packageAllowedDays)
    .where(eq(packageAllowedDays.packageId, packageId))
  if (days.length > 0) {
    await db.insert(packageAllowedDays).values(
      days.map((d) => ({
        packageId,
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
      })),
    )
  }
}

export async function hasSubscriptions(packageId: string) {
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.packageId, packageId))
    .limit(1)
  return existing.length > 0
}
