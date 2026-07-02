import {
  uuid,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { memberStatusEnum } from './enums.ts'
import { corporateAccounts } from './corporate-accounts.ts'

export const members = pgTable(
  'members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fullName: text('full_name').notNull(),
    documentNumber: text('document_number'),
    phone: text('phone'),
    email: text('email'),
    birthDate: timestamp('birth_date'),
    gender: text('gender'),
    address: text('address'),
    branchId: uuid('branch_id'),
    corporateAccountId: uuid('corporate_account_id').references(() => corporateAccounts.id),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    qrCode: text('qr_code'),
    photoUrl: text('photo_url'),
    physicalRestrictions: text('physical_restrictions'),
    medicalNotes: text('medical_notes'),
    contractSignature: text('contract_signature'),
    status: memberStatusEnum('status').notNull().default('ACTIVE'),
    referralCode: text('referral_code'),
    referredBy: uuid('referred_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('members_document_number_idx').on(table.documentNumber),
    uniqueIndex('members_qr_code_idx').on(table.qrCode),
    uniqueIndex('members_referral_code_idx').on(table.referralCode),
  ],
)
