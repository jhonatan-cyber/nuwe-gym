import { pgEnum } from 'drizzle-orm/pg-core'


export const memberStatusEnum = pgEnum('member_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
])
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'EXPIRED',
  'CANCELED',
])
export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH',
  'QR',
  'TRANSFER',
  'CARD',
])
export const checkInResultEnum = pgEnum('check_in_result', [
  'ALLOWED',
  'DENIED_EXPIRED',
  'DENIED_INACTIVE',
  'DENIED_SUSPENDED',
])
export const saleStatusEnum = pgEnum('sale_status', ['COMPLETED', 'CANCELED'])
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'PURCHASE',
  'SALE',
  'MANUAL_ADJUSTMENT',
  'RETURN',
  'LOSS',
])
export const cashSessionStatusEnum = pgEnum('cash_session_status', [
  'OPEN',
  'CLOSED',
])
export const cashMovementTypeEnum = pgEnum('cash_movement_type', [
  'INCOME',
  'EXPENSE',
])
export const cashSourceTypeEnum = pgEnum('cash_source_type', [
  'MEMBERSHIP_PAYMENT',
  'SALE',
  'MANUAL',
  'OTHER',
])
export const bookingStatusEnum = pgEnum('booking_status', [
  'CONFIRMED',
  'CANCELLED',
  'ATTENDED',
])
export const packageTypeEnum = pgEnum('package_type', [
  'PACKAGE',
  'PROMOTION',
  'SPECIAL',
])
