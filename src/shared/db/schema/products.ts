import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { productCategories } from './product-categories.ts'

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    sku: text('sku').notNull(),
    barcode: text('barcode'),
    name: text('name').notNull(),
    description: text('description'),
    categoryId: integer('category_id')
      .notNull()
      .references(() => productCategories.id),
    purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    salePrice: numeric('sale_price', { precision: 10, scale: 2 }).notNull(),
    stockCurrent: integer('stock_current').notNull().default(0),
    stockMinimum: integer('stock_minimum').notNull().default(0),
    imageUrl: text('image_url'),
    branchId: integer('branch_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('products_sku_idx').on(table.sku)],
)
