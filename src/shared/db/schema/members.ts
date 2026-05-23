import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { memberStatusEnum } from './enums.ts'

export const members = pgTable(
  'members',
  {
    id: serial('id').primaryKey(),
    fullName: text('full_name').notNull(),
    documentNumber: text('document_number'),
    phone: text('phone'),
    email: text('email'),
    birthDate: timestamp('birth_date'),
    address: text('address'),
    branchId: integer('branch_id'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    qrCode: text('qr_code'),
    photoUrl: text('photo_url'),
    status: memberStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('members_document_number_idx').on(table.documentNumber),
    uniqueIndex('members_qr_code_idx').on(table.qrCode),
  ],
)
