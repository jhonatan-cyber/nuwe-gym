import {
  uuid,
  pgTable,
  integer,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { inventoryMovementTypeEnum } from './enums.ts'
import { products } from './products.ts'
import { users } from './auth.ts'

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    movementType: inventoryMovementTypeEnum('movement_type').notNull(),
    quantity: integer('quantity').notNull(),
    previousStock: integer('previous_stock').notNull(),
    newStock: integer('new_stock').notNull(),
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
    batchNumber: text('batch_number'),
    notes: text('notes'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('inventory_movements_product_id_idx').on(table.productId),
    index('inventory_movements_created_by_user_id_idx').on(
      table.createdByUserId,
    ),
    index('inventory_movements_created_at_idx').on(table.createdAt),
  ],
)
