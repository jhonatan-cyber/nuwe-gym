import {
  uuid,
  pgTable,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'
import { users } from './auth.ts'

export const employeeDocuments = pgTable(
  'employee_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull().default('OTHER'),
    description: text('description').default(''),
    fileUrl: text('file_url').default(''),
    fileName: text('file_name').default(''),
    fileSize: text('file_size').default(''),
    uploadedById: text('uploaded_by_id')
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('employee_documents_employee_id_idx').on(table.employeeId),
  ],
)
