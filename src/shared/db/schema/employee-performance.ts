import {
  uuid,
  pgTable,
  text,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core'
import { employees } from './employees.ts'
import { users } from './auth.ts'

export const employeePerformance = pgTable(
  'employee_performance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    evaluatedById: text('evaluated_by_id')
      .references(() => users.id),
    evaluationDate: timestamp('evaluation_date').notNull().defaultNow(),
    // Overall rating 1-5
    rating: integer('rating').default(3),
    // Specific areas
    punctuality: integer('punctuality').default(3),
    teamwork: integer('teamwork').default(3),
    productivity: integer('productivity').default(3),
    attitude: integer('attitude').default(3),
    communication: integer('communication').default(3),
    // Notes
    strengths: text('strengths').default(''),
    improvements: text('improvements').default(''),
    comments: text('comments').default(''),
    // Reviewer's recommendation
    recommendation: text('recommendation').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('employee_performance_employee_id_idx').on(table.employeeId),
    index('employee_performance_date_idx').on(table.evaluationDate),
  ],
)
