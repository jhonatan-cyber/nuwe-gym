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
    console.log('[packages] createPackage input:', JSON.stringify(data, null, 2))

    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    console.log('[packages] insertando package...')
    const pkg = await repo.insert(data)
    console.log('[packages] package creado:', pkg.id)

    if (data.items.length > 0) {
      console.log('[packages] reemplazando items:', data.items.length)
      await repo.replacePackageItems(pkg.id, data.items)
    }
    if (data.allowedDays.length > 0) {
      console.log('[packages] reemplazando allowedDays:', data.allowedDays.length)
      await repo.replaceAllowedDays(pkg.id, data.allowedDays)
    }
    console.log('[packages] reemplazando benefits:', data.benefits.length)
    await repo.replacePackageBenefits(pkg.id, data.benefits)

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
    console.log('[packages] updatePackage input:', JSON.stringify({ id: data.id, name: data.name }, null, 2))

    const session = await requireRole({
      data: { roles: ['ADMIN', 'RECEPTIONIST'] },
    })

    console.log('[packages] actualizando package...')
    const pkg = await repo.update(data.id, data)
    console.log('[packages] reemplazando items:', data.items.length)
    await repo.replacePackageItems(data.id, data.items)
    console.log('[packages] reemplazando allowedDays:', data.allowedDays.length)
    await repo.replaceAllowedDays(data.id, data.allowedDays)
    console.log('[packages] reemplazando benefits:', data.benefits.length)
    await repo.replacePackageBenefits(data.id, data.benefits)

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
