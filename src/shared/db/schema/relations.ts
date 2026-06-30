import { relations } from 'drizzle-orm'
import { users, sessions, accounts } from './auth.ts'
import { roles } from './roles.ts'
import { members } from './members.ts'
import { subscriptions } from './subscriptions.ts'
import { membershipPayments } from './membership-payments.ts'
import { checkIns } from './check-ins.ts'
import { productCategories } from './product-categories.ts'
import { products } from './products.ts'
import { productStock } from './product-stock.ts'
import { suppliers } from './suppliers.ts'
import { purchases, purchaseItems } from './purchases.ts'
import { sales, saleItems } from './sales.ts'
import { inventoryMovements } from './inventory.ts'
import { cashRegisterSessions, cashMovements } from './cash-register.ts'
import { classes, classSchedules, classBookings } from './classes.ts'
import {
  trainerProfiles,
  trainerAssignments,
  trainerAvailability,
} from './trainers.ts'
import { membershipFreezes } from './membership-freezes.ts'
import { auditLogs } from './audit-logs.ts'
import { branches, userBranches } from './branches.ts'
import { packages, packageItems, packageAllowedDays, packageBenefits } from './packages.ts'

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  roleObj: one(roles, { fields: [users.role], references: [roles.name] }),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const membersRelations = relations(members, ({ many, one }) => ({
  branch: one(branches, {
    fields: [members.branchId],
    references: [branches.id],
  }),
  subscriptions: many(subscriptions),
  membershipPayments: many(membershipPayments),
  checkIns: many(checkIns),
  sales: many(sales),
  freezes: many(membershipFreezes),
}))

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    member: one(members, {
      fields: [subscriptions.memberId],
      references: [members.id],
    }),
    package: one(packages, {
      fields: [subscriptions.packageId],
      references: [packages.id],
    }),
    payments: many(membershipPayments),
    freezes: many(membershipFreezes),
  }),
)

export const membershipPaymentsRelations = relations(
  membershipPayments,
  ({ one }) => ({
    member: one(members, {
      fields: [membershipPayments.memberId],
      references: [members.id],
    }),
    subscription: one(subscriptions, {
      fields: [membershipPayments.subscriptionId],
      references: [subscriptions.id],
    }),
    createdBy: one(users, {
      fields: [membershipPayments.createdByUserId],
      references: [users.id],
    }),
  }),
)

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  member: one(members, {
    fields: [checkIns.memberId],
    references: [members.id],
  }),
  registeredBy: one(users, {
    fields: [checkIns.registeredByUserId],
    references: [users.id],
  }),
}))

export const productCategoriesRelations = relations(
  productCategories,
  ({ many }) => ({
    products: many(products),
  }),
)

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  stockEntries: many(productStock),
  saleItems: many(saleItems),
  purchaseItems: many(purchaseItems),
  inventoryMovements: many(inventoryMovements),
}))

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, {
    fields: [productStock.productId],
    references: [products.id],
  }),
  branch: one(branches, {
    fields: [productStock.branchId],
    references: [branches.id],
  }),
}))

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}))
export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  createdBy: one(users, {
    fields: [purchases.createdByUserId],
    references: [users.id],
  }),
  items: many(purchaseItems),
}))

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  product: one(products, {
    fields: [purchaseItems.productId],
    references: [products.id],
  }),
}))

export const salesRelations = relations(sales, ({ one, many }) => ({
  user: one(users, { fields: [sales.userId], references: [users.id] }),
  member: one(members, { fields: [sales.memberId], references: [members.id] }),
  items: many(saleItems),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}))

export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryMovements.productId],
      references: [products.id],
    }),
    createdBy: one(users, {
      fields: [inventoryMovements.createdByUserId],
      references: [users.id],
    }),
  }),
)

export const cashRegisterSessionsRelations = relations(
  cashRegisterSessions,
  ({ one, many }) => ({
    openedBy: one(users, {
      fields: [cashRegisterSessions.openedByUserId],
      references: [users.id],
    }),
    branch: one(branches, {
      fields: [cashRegisterSessions.branchId],
      references: [branches.id],
    }),
    movements: many(cashMovements),
  }),
)

export const cashMovementsRelations = relations(cashMovements, ({ one }) => ({
  session: one(cashRegisterSessions, {
    fields: [cashMovements.cashSessionId],
    references: [cashRegisterSessions.id],
  }),
}))

export const classesRelations = relations(classes, ({ many }) => ({
  schedules: many(classSchedules),
}))

export const classSchedulesRelations = relations(
  classSchedules,
  ({ one, many }) => ({
    class: one(classes, {
      fields: [classSchedules.classId],
      references: [classes.id],
    }),
    bookings: many(classBookings),
  }),
)

export const classBookingsRelations = relations(classBookings, ({ one }) => ({
  schedule: one(classSchedules, {
    fields: [classBookings.classScheduleId],
    references: [classSchedules.id],
  }),
  member: one(members, {
    fields: [classBookings.memberId],
    references: [members.id],
  }),
}))

export const trainerProfilesRelations = relations(
  trainerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [trainerProfiles.userId],
      references: [users.id],
    }),
    assignments: many(trainerAssignments),
    availability: many(trainerAvailability),
  }),
)

export const trainerAssignmentsRelations = relations(
  trainerAssignments,
  ({ one }) => ({
    trainer: one(trainerProfiles, {
      fields: [trainerAssignments.trainerId],
      references: [trainerProfiles.id],
    }),
    member: one(members, {
      fields: [trainerAssignments.memberId],
      references: [members.id],
    }),
  }),
)

export const trainerAvailabilityRelations = relations(
  trainerAvailability,
  ({ one }) => ({
    trainer: one(trainerProfiles, {
      fields: [trainerAvailability.trainerId],
      references: [trainerProfiles.id],
    }),
  }),
)

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

export const membershipFreezesRelations = relations(
  membershipFreezes,
  ({ one }) => ({
    subscription: one(subscriptions, {
      fields: [membershipFreezes.subscriptionId],
      references: [subscriptions.id],
    }),
    member: one(members, {
      fields: [membershipFreezes.memberId],
      references: [members.id],
    }),
  }),
)

export const branchesRelations = relations(branches, ({ many }) => ({
  userBranches: many(userBranches),
  members: many(members),
  productStock: many(productStock),
}))

export const userBranchesRelations = relations(userBranches, ({ one }) => ({
  user: one(users, { fields: [userBranches.userId], references: [users.id] }),
  branch: one(branches, {
    fields: [userBranches.branchId],
    references: [branches.id],
  }),
}))

export const packagesRelations = relations(packages, ({ many }) => ({
  items: many(packageItems),
  allowedDays: many(packageAllowedDays),
  subscriptions: many(subscriptions),
  benefits: many(packageBenefits),
}))

export const packageBenefitsRelations = relations(packageBenefits, ({ one }) => ({
  package: one(packages, {
    fields: [packageBenefits.packageId],
    references: [packages.id],
  }),
}))

export const packageItemsRelations = relations(packageItems, ({ one }) => ({
  package: one(packages, {
    fields: [packageItems.packageId],
    references: [packages.id],
  }),
}))

export const packageAllowedDaysRelations = relations(
  packageAllowedDays,
  ({ one }) => ({
    package: one(packages, {
      fields: [packageAllowedDays.packageId],
      references: [packages.id],
    }),
  }),
)
