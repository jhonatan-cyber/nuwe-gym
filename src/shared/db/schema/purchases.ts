import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { suppliers } from './suppliers.ts'
import { users } from './auth.ts'
import { products } from './products.ts'

export const purchases = pgTable(
  'purchases',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    purchaseNumber: text('purchase_number').notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    notes: text('notes'),
    purchasedAt: timestamp('purchased_at').notNull().defaultNow(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('purchases_supplier_id_idx').on(table.supplierId),
    index('purchases_created_by_user_id_idx').on(table.createdByUserId),
  ],
)

export const purchaseItems = pgTable(
  'purchase_items',
  {
    id: serial('id').primaryKey(),
    purchaseId: integer('purchase_id')
      .notNull()
      .references(() => purchases.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    index('purchase_items_purchase_id_idx').on(table.purchaseId),
    index('purchase_items_product_id_idx').on(table.productId),
  ],
)
