import { uuid, pgTable, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { classSchedules } from './classes.ts'
import { members } from './members.ts'

/**
 * Lista de espera para clases con capacidad llena.
 * Cuando se libera un cupo (cancelación), el primer en la lista
 * puede ser notificado / promovido automáticamente.
 */
export const classWaitlist = pgTable(
  'class_waitlist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classScheduleId: uuid('class_schedule_id')
      .notNull()
      .references(() => classSchedules.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [
    index('class_waitlist_schedule_id_idx').on(table.classScheduleId),
    index('class_waitlist_member_id_idx').on(table.memberId),
    unique('class_waitlist_unique').on(table.classScheduleId, table.memberId),
  ],
)
