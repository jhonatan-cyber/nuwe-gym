import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { saleStatusEnum, paymentMethodEnum } from './enums.ts'
import { users } from './auth.ts'
import { members } from './members.ts'
import { products } from './products.ts'

export const sales = pgTable(
  'sales',
  {
    id: serial('id').primaryKey(),
    saleNumber: text('sale_number').notNull(),
    memberId: integer('member_id').references(() => members.id),
    customerName: text('customer_name'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method'),
    status: saleStatusEnum('status').notNull().default('COMPLETED'),
    soldAt: timestamp('sold_at').notNull().defaultNow(),
    cashSessionId: integer('cash_session_id'),
    branchId: integer('branch_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('sales_member_id_idx').on(table.memberId),
    index('sales_user_id_idx').on(table.userId),
    index('sales_cash_session_id_idx').on(table.cashSessionId),
    index('sales_sold_at_idx').on(table.soldAt),
    index('sales_created_at_idx').on(table.createdAt),
  ],
)

export const saleItems = pgTable(
  'sale_items',
  {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    index('sale_items_sale_id_idx').on(table.saleId),
    index('sale_items_product_id_idx').on(table.productId),
  ],
)
