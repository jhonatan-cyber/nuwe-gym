import {
  uuid,
  pgTable,
  text,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { productCategories } from './product-categories.ts'

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sku: text('sku').notNull(),
    barcode: text('barcode'),
    name: text('name').notNull(),
    description: text('description'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => productCategories.id),
    purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    salePrice: numeric('sale_price', { precision: 10, scale: 2 }).notNull(),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('products_sku_idx').on(table.sku)],
)
