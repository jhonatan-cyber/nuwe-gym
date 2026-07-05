import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { roles } from '#/shared/db/schema/roles.ts'
import { permissions, rolePermissions } from '#/shared/db/schema/permissions.ts'
import { departments } from '#/shared/db/schema/departments.ts'
import { employees } from '#/shared/db/schema/employees.ts'
import { eq } from 'drizzle-orm'
import { auth } from '#/shared/lib/auth.ts'
import { z } from 'zod'
import { optionalString, requiredString } from '#/shared/lib/schemas.ts'
import { generateCode8 } from '#/shared/lib/utils.ts'

export const checkDbEmpty = createServerFn({ method: 'GET' }).handler(
  async () => {
    const existingUsers = await db.select().from(users).limit(1)
    return { isEmpty: existingUsers.length === 0 }
  },
)

const createInitialAdminSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  documentNumber: requiredString,
  phone: optionalString,
  address: optionalString,
})

const ALL_PERMISSIONS = [
  'members:read', 'members:write', 'plans:read', 'plans:write',
  'subscriptions:read', 'subscriptions:write', 'payments:read', 'payments:write',
  'checkins:read', 'checkins:write', 'classes:read', 'classes:write',
  'products:read', 'products:write', 'categories:read', 'categories:write',
  'suppliers:read', 'suppliers:write', 'purchases:read', 'purchases:write',
  'sales:read', 'sales:write', 'pos:use', 'inventory:read', 'inventory:write',
  'cash:read', 'cash:write', 'dashboard:read', 'users:read', 'users:write',
  'reports:read', 'settings:read', 'settings:write', 'renewals:read', 'renewals:write',
  'export:read', 'trainers:read', 'trainers:write', 'notifications:read', 'notifications:write',
  'membership-freezes:read', 'membership-freezes:write', 'audit:read', 'audit:export',
  'branches:read', 'branches:write', 'backup:read', 'backup:write',
  'nutrition:read', 'nutrition:write', 'guest-passes:read', 'guest-passes:write',
  'employees:read', 'employees:write',
]

export const createInitialAdmin = createServerFn({ method: 'POST' })
  .validator((data) => createInitialAdminSchema.parse(data))
  .handler(async ({ data }) => {
    const existingUsers = await db.select().from(users).limit(1)
    if (existingUsers.length > 0) {
      throw new Error(
        'No se puede crear el administrador inicial si ya existen usuarios.',
      )
    }

    // 1. Create admin role with all permissions
    await db.insert(roles).values({
      name: 'ADMIN',
      label: 'Administrador',
      description: 'Acceso total al sistema.',
    }).onConflictDoNothing()

    const existingPerms = await db.select().from(permissions)
    if (existingPerms.length === 0) {
      const perms = ALL_PERMISSIONS.map((p) => {
        const [module, action] = p.split(':')
        return { name: p, label: `${module} ${action}`, module }
      })
      await db.insert(permissions).values(perms)
    }

    await db.insert(rolePermissions).values(
      ALL_PERMISSIONS.map((perm) => ({ roleName: 'ADMIN' as const, permissionName: perm })),
    ).onConflictDoNothing()

    // 2. Create gerencia department
    await db.insert(departments).values({
      name: 'Gerencia',
      description: 'Dirección y gestión general del negocio.',
    }).onConflictDoNothing()

    const [dept] = await db.select().from(departments).where(eq(departments.name, 'Gerencia')).limit(1)

    // 3. Create user
    let userId: string
    try {
      const result = await auth.api.signUpEmail({
        headers: new Headers(),
        body: {
          email: data.email,
          password: data.documentNumber,
          name: data.name,
        },
      })
      userId = result.user.id
    } catch (err: any) {
      const message =
        err?.body?.message ||
        err?.message ||
        'No se pudo crear el usuario. Verificá que el email no esté en uso y que el documento tenga al menos 4 caracteres.'
      throw new Error(message)
    }

    // 4. Set role and employee record
    await db.update(users).set({
      role: 'ADMIN',
      emailVerified: true,
      documentNumber: data.documentNumber,
      phone: data.phone || null,
      address: data.address || null,
    }).where(eq(users.id, userId))

    await db.insert(employees).values({
      userId,
      employeeCode: generateCode8(),
      fullName: data.name,
      email: data.email,
      phone: data.phone || null,
      documentNumber: data.documentNumber,
      position: 'Administrador',
      roleId: 'ADMIN',
      departmentId: dept.id,
      status: 'ACTIVE',
      hireDate: new Date(),
    })

    return { success: true }
  })
