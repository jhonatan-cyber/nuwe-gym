import { relations } from 'drizzle-orm'
import { users, sessions, accounts } from './auth.ts'
import { roles } from './roles.ts'
import { permissions, rolePermissions } from './permissions.ts'
import { departments } from './departments.ts'
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
import { nutritionPlans } from './nutrition-plans.ts'
import { weightHistory } from './weight-history.ts'
import { classWaitlist } from './class-waitlist.ts'
import { memberEvaluations } from './member-evaluations.ts'
import { guestPasses } from './guest-passes.ts'
import {
  loyaltyTiers,
  loyaltyPoints,
  coupons,
  couponUsage,
  challenges,
  challengeProgress,
  badges,
  memberBadges,
} from './loyalty.ts'
import { promotions } from './promotions.ts'
import { corporateAccounts } from './corporate-accounts.ts'
import { familyGroups, familyMembers } from './family-groups.ts'
import { invoices, invoiceSequences } from './invoices.ts'
import { employees } from './employees.ts'
import { employeeAttendance } from './employee-attendance.ts'
import { memberBranches } from './member-branches.ts'
import { userDevices } from './user-devices.ts'
import { memberPaymentMethods } from './member-payment-methods.ts'
import { employeeSchedules } from './employee-schedules.ts'
import { employeeVacations } from './employee-vacations.ts'
import { employeeBonuses } from './employee-bonuses.ts'
import { payroll } from './payroll.ts'
import { employeePerformance } from './employee-performance.ts'
import { employeeContracts } from './employee-contracts.ts'
import { employeeDocuments } from './employee-documents.ts'

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  devices: many(userDevices),
  roleObj: one(roles, { fields: [users.role], references: [roles.name] }),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleName], references: [roles.name] }),
  permission: one(permissions, { fields: [rolePermissions.permissionName], references: [permissions.name] }),
}))

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
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
  weightHistory: many(weightHistory),
  nutritionPlans: many(nutritionPlans),
  evaluations: many(memberEvaluations),
  guestPasses: many(guestPasses),
  loyaltyPoints: many(loyaltyPoints),
  referred: one(members, {
    fields: [members.referredBy],
    references: [members.id],
  }),
  challengeProgress: many(challengeProgress),
  memberBadges: many(memberBadges),
  memberBranches: many(memberBranches),
  paymentMethods: many(memberPaymentMethods),
  corporateAccount: one(corporateAccounts, {
    fields: [members.corporateAccountId],
    references: [corporateAccounts.id],
  }),
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
    waitlist: many(classWaitlist),
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
  employees: many(employees),
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

// ── Nutrition & Weight ────────────────────────────────────────────

export const nutritionPlansRelations = relations(nutritionPlans, ({ one }) => ({
  member: one(members, {
    fields: [nutritionPlans.memberId],
    references: [members.id],
  }),
  createdBy: one(users, {
    fields: [nutritionPlans.createdByUserId],
    references: [users.id],
  }),
}))

export const weightHistoryRelations = relations(weightHistory, ({ one }) => ({
  member: one(members, {
    fields: [weightHistory.memberId],
    references: [members.id],
  }),
  recordedBy: one(users, {
    fields: [weightHistory.recordedByUserId],
    references: [users.id],
  }),
}))

// ── Member Evaluations ────────────────────────────────────────────

export const memberEvaluationsRelations = relations(
  memberEvaluations,
  ({ one }) => ({
    member: one(members, {
      fields: [memberEvaluations.memberId],
      references: [members.id],
    }),
    evaluatedBy: one(users, {
      fields: [memberEvaluations.evaluatedById],
      references: [users.id],
    }),
  }),
)

// ── Class Waitlist ────────────────────────────────────────────────

export const classWaitlistRelations = relations(classWaitlist, ({ one }) => ({
  schedule: one(classSchedules, {
    fields: [classWaitlist.classScheduleId],
    references: [classSchedules.id],
  }),
  member: one(members, {
    fields: [classWaitlist.memberId],
    references: [members.id],
  }),
}))

// ── Guest Passes ───────────────────────────────────────────────────

export const guestPassesRelations = relations(guestPasses, ({ one }) => ({
  member: one(members, {
    fields: [guestPasses.memberId],
    references: [members.id],
  }),
  usedBy: one(users, {
    fields: [guestPasses.usedByUserId],
    references: [users.id],
  }),
}))

export const loyaltyTiersRelations = relations(loyaltyTiers, () => ({}))

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  member: one(members, {
    fields: [loyaltyPoints.memberId],
    references: [members.id],
  }),
}))

export const couponsRelations = relations(coupons, () => ({}))

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsage.couponId],
    references: [coupons.id],
  }),
}))

export const challengesRelations = relations(challenges, () => ({}))

export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeProgress.challengeId],
    references: [challenges.id],
  }),
  member: one(members, {
    fields: [challengeProgress.memberId],
    references: [members.id],
  }),
}))

export const badgesRelations = relations(badges, () => ({}))

export const memberBadgesRelations = relations(memberBadges, ({ one }) => ({
  member: one(members, {
    fields: [memberBadges.memberId],
    references: [members.id],
  }),
  badge: one(badges, {
    fields: [memberBadges.badgeId],
    references: [badges.id],
  }),
}))

export const promotionsRelations = relations(promotions, () => ({}))

export const corporateAccountsRelations = relations(
  corporateAccounts,
  ({ many, one }) => ({
    members: many(members),
    branch: one(branches, {
      fields: [corporateAccounts.branchId],
      references: [branches.id],
    }),
  }),
)

export const familyGroupsRelations = relations(
  familyGroups,
  ({ many, one }) => ({
    primaryMember: one(members, {
      fields: [familyGroups.primaryMemberId],
      references: [members.id],
    }),
    familyMembers: many(familyMembers),
    branch: one(branches, {
      fields: [familyGroups.branchId],
      references: [branches.id],
    }),
  }),
)

export const familyMembersRelations = relations(
  familyMembers,
  ({ one }) => ({
    familyGroup: one(familyGroups, {
      fields: [familyMembers.familyGroupId],
      references: [familyGroups.id],
    }),
    member: one(members, {
      fields: [familyMembers.memberId],
      references: [members.id],
    }),
  }),
)

export const invoicesRelations = relations(invoices, ({ one }) => ({
  member: one(members, {
    fields: [invoices.memberId],
    references: [members.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdByUserId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [invoices.branchId],
    references: [branches.id],
  }),
}))

export const invoiceSequencesRelations = relations(invoiceSequences, ({ one }) => ({
  branch: one(branches, {
    fields: [invoiceSequences.branchId],
    references: [branches.id],
  }),
}))


export const userDevicesRelations = relations(userDevices, ({ one }) => ({
  user: one(users, {
    fields: [userDevices.userId],
    references: [users.id],
  }),
}))

export const memberBranchesRelations = relations(memberBranches, ({ one }) => ({
  member: one(members, {
    fields: [memberBranches.memberId],
    references: [members.id],
  }),
  branch: one(branches, {
    fields: [memberBranches.branchId],
    references: [branches.id],
  }),
}))

export const memberPaymentMethodsRelations = relations(memberPaymentMethods, ({ one }) => ({
  member: one(members, {
    fields: [memberPaymentMethods.memberId],
    references: [members.id],
  }),
}))

// ── Employees ──────────────────────────────────────────────────────

export const employeesRelations = relations(employees, ({ many, one }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  branch: one(branches, { fields: [employees.branchId], references: [branches.id] }),
  role: one(roles, { fields: [employees.roleId], references: [roles.name] }),
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
  schedules: many(employeeSchedules),
  attendance: many(employeeAttendance),
  vacations: many(employeeVacations),
  bonuses: many(employeeBonuses),
  payrollRecords: many(payroll),
  performanceEvaluations: many(employeePerformance),
  contracts: many(employeeContracts),
  documents: many(employeeDocuments),
}))

export const employeeAttendanceRelations = relations(employeeAttendance, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeAttendance.employeeId],
    references: [employees.id],
  }),
}))

export const employeeSchedulesRelations = relations(employeeSchedules, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeSchedules.employeeId],
    references: [employees.id],
  }),
}))

export const employeeVacationsRelations = relations(employeeVacations, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeVacations.employeeId],
    references: [employees.id],
  }),
}))

export const employeeBonusesRelations = relations(employeeBonuses, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeBonuses.employeeId],
    references: [employees.id],
  }),
}))

export const payrollRelations = relations(payroll, ({ one }) => ({
  employee: one(employees, {
    fields: [payroll.employeeId],
    references: [employees.id],
  }),
}))

export const employeePerformanceRelations = relations(employeePerformance, ({ one }) => ({
  employee: one(employees, {
    fields: [employeePerformance.employeeId],
    references: [employees.id],
  }),
  evaluatedBy: one(users, {
    fields: [employeePerformance.evaluatedById],
    references: [users.id],
  }),
}))

export const employeeContractsRelations = relations(employeeContracts, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeContracts.employeeId],
    references: [employees.id],
  }),
}))

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
  uploadedBy: one(users, {
    fields: [employeeDocuments.uploadedById],
    references: [users.id],
  }),
}))
