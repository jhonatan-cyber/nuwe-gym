import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { inventoryMovements } from '#/shared/db/schema/inventory.ts'
import { desc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'

export const getInventoryMovements = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return await db.query.inventoryMovements.findMany({
      orderBy: [desc(inventoryMovements.createdAt)],
      with: {
        product: true,
        createdBy: true,
      },
    })
  },
)
