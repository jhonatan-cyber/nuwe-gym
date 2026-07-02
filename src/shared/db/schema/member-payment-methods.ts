import {
  uuid,
  pgTable,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'

export const memberPaymentMethods = pgTable(
  'member_payment_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').default(''),
    stripePaymentMethodId: text('stripe_payment_method_id').notNull(),
    cardBrand: text('card_brand').notNull().default(''),
    cardLast4: text('card_last4').notNull().default(''),
    cardExpMonth: text('card_exp_month').default(''),
    cardExpYear: text('card_exp_year').default(''),
    isDefault: boolean('is_default').default(false),
    autoPay: boolean('auto_pay').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('member_payment_methods_member_id_idx').on(table.memberId),
    index('member_payment_methods_stripe_pm_id_idx').on(
      table.stripePaymentMethodId,
    ),
  ],
)
