import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { packages, packageItems } from '#/shared/db/schema/packages.ts'
import { eq, desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'

export const getPackages = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.query.packages.findMany({
      with: { items: true },
      orderBy: [desc(packages.createdAt)],
    })
  },
)

export const getActivePackages = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.query.packages.findMany({
      where: eq(packages.isActive, true),
      with: { items: true },
      orderBy: [desc(packages.createdAt)],
    })
  },
)

const packageItemSchema = z.object({
  description: z.string().min(1),
  sortOrder: z.number().default(0),
})

const createPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageBase64: z.string().optional(),
  price: z.string(),
  durationDays: z.number().min(1),
  type: z.enum(['PACKAGE', 'PROMOTION', 'SPECIAL']).default('PACKAGE'),
  items: z.array(packageItemSchema).default([]),
})

export const createPackage = createServerFn({ method: 'POST' })
  .inputValidator((data) => createPackageSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [pkg] = await db
      .insert(packages)
      .values({
        name: data.name,
        description: data.description,
        imageBase64: data.imageBase64,
        price: data.price,
        durationDays: data.durationDays,
        type: data.type,
      })
      .returning()

    if (data.items.length > 0) {
      await db.insert(packageItems).values(
        data.items.map((item, idx) => ({
          packageId: pkg.id,
          description: item.description,
          sortOrder: item.sortOrder ?? idx,
        })),
      )
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'PACKAGE',
      entityId: pkg.id,
      description: `Creó paquete ${pkg.name}`,
    })

    return pkg
  })

const updatePackageSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageBase64: z.string().optional(),
  price: z.string(),
  durationDays: z.number().min(1),
  type: z.enum(['PACKAGE', 'PROMOTION', 'SPECIAL']),
  isActive: z.boolean(),
  items: z.array(packageItemSchema).default([]),
})

export const updatePackage = createServerFn({ method: 'POST' })
  .inputValidator((data) => updatePackageSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [pkg] = await db
      .update(packages)
      .set({
        name: data.name,
        description: data.description,
        imageBase64: data.imageBase64,
        price: data.price,
        durationDays: data.durationDays,
        type: data.type,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, data.id))
      .returning()

    // Replace items: delete all, insert fresh
    await db.delete(packageItems).where(eq(packageItems.packageId, data.id))

    if (data.items.length > 0) {
      await db.insert(packageItems).values(
        data.items.map((item, idx) => ({
          packageId: data.id,
          description: item.description,
          sortOrder: item.sortOrder ?? idx,
        })),
      )
    }

    createAuditLog({
      ...getAuditContext(session),
      action: 'UPDATE',
      entityType: 'PACKAGE',
      entityId: pkg.id,
      description: `Actualizó paquete ${pkg.name}`,
    })

    return pkg
  })

export const deletePackage = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ id: z.number() }).parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const [pkg] = await db
      .delete(packages)
      .where(eq(packages.id, data.id))
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'PACKAGE',
      entityId: data.id,
      description: `Eliminó paquete ${pkg.name}`,
    })

    return pkg
  })
