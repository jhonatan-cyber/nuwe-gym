import {
  uuid,
  pgTable,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { products } from './products.ts'
import { branches } from './branches.ts'

export const productStock = pgTable(
  'product_stock',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    stockCurrent: integer('stock_current').notNull().default(0),
    stockMinimum: integer('stock_minimum').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('product_stock_product_branch_idx').on(
      table.productId,
      table.branchId,
    ),
  ],
)
