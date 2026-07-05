import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '#/shared/db/index.ts'
import { roles } from '#/shared/db/schema/roles.ts'
import { permissions, rolePermissions } from '#/shared/db/schema/permissions.ts'
import { requirePermission } from '#/shared/lib/server-utils.ts'

// ── List ──

export const getRoles = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requirePermission({ data: { permission: 'users:read' } })
    return await db.query.roles.findMany({
      orderBy: [desc(roles.name)],
      with: { rolePermissions: true },
    })
  },
)

// ── Get by name ──

export const getRole = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ name: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'users:read' } })
    return await db.query.roles.findFirst({
      where: eq(roles.name, data.name),
      with: { rolePermissions: true },
    })
  })

// ── Get all permissions ──

export const getAllPermissions = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requirePermission({ data: { permission: 'users:read' } })
    return await db.query.permissions.findMany({
      orderBy: [permissions.module, permissions.name],
    })
  },
)

// ── Create role ──

const createRoleSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').regex(/^[A-Z_]+$/, 'Solo mayúsculas y guiones bajos'),
  label: z.string().min(1, 'Etiqueta requerida'),
  description: z.string().default(''),
  permissionNames: z.array(z.string()).default([]),
})

export const createRole = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createRoleSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'users:write' } })

    const [role] = await db
      .insert(roles)
      .values({ name: data.name, label: data.label, description: data.description })
      .returning()

    if (data.permissionNames.length > 0) {
      await db.insert(rolePermissions).values(
        data.permissionNames.map((permName) => ({
          roleName: data.name,
          permissionName: permName,
        })),
      )
    }

    return role
  })

// ── Update role ──

const updateRoleSchema = z.object({
  name: z.string(),
  label: z.string().min(1, 'Etiqueta requerida').optional(),
  description: z.string().optional(),
  permissionNames: z.array(z.string()).optional(),
})

export const updateRole = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateRoleSchema.parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'users:write' } })

    const { name, permissionNames, ...updates } = data

    if (updates.label !== undefined || updates.description !== undefined) {
      await db.update(roles).set(updates).where(eq(roles.name, name))
    }

    if (permissionNames !== undefined) {
      // Delete existing permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleName, name))
      // Insert new permissions
      if (permissionNames.length > 0) {
        await db.insert(rolePermissions).values(
          permissionNames.map((permName) => ({
            roleName: name,
            permissionName: permName,
          })),
        )
      }
    }

    return { success: true }
  })

// ── Delete role ──

export const deleteRole = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ name: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await requirePermission({ data: { permission: 'users:write' } })
    // Don't allow deleting built-in roles
    if (['ADMIN', 'RECEPTIONIST', 'TRAINER'].includes(data.name)) {
      throw new Error('No se pueden eliminar roles del sistema')
    }
    await db.delete(rolePermissions).where(eq(rolePermissions.roleName, data.name))
    await db.delete(roles).where(eq(roles.name, data.name))
    return { success: true }
  })
