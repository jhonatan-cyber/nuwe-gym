import { createServerFn } from '@tanstack/react-start'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { createPackageSchema, updatePackageSchema, deletePackageSchema } from './packages.schema.ts'
import * as repo from './packages.repository.ts'

export const getPackages = createServerFn({ method: 'GET' }).handler(
  async () => repo.findAll(),
)

export const getActivePackages = createServerFn({ method: 'GET' }).handler(
  async () => repo.findActive(),
)

export const createPackage = createServerFn({ method: 'POST' })
  .inputValidator((data) => createPackageSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const pkg = await repo.insert(data)

    if (data.items.length > 0) {
      await repo.replacePackageItems(pkg.id, data.items)
    }
    if (data.allowedDays.length > 0) {
      await repo.replaceAllowedDays(pkg.id, data.allowedDays)
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

export const updatePackage = createServerFn({ method: 'POST' })
  .inputValidator((data) => updatePackageSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const pkg = await repo.update(data.id, data)
    await repo.replacePackageItems(data.id, data.items)
    await repo.replaceAllowedDays(data.id, data.allowedDays)

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
  .inputValidator((data) => deletePackageSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    const hasSubs = await repo.hasSubscriptions(data.id)
    if (hasSubs) {
      throw new Error('El plan tiene socios que están o estuvieron en el plan')
    }

    const pkg = await repo.remove(data.id)

    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'PACKAGE',
      entityId: data.id,
      description: `Eliminó paquete ${pkg.name}`,
    })

    return pkg
  })
