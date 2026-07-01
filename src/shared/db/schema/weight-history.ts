import {
  uuid,
  pgTable,
  numeric,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'
import { users } from './auth.ts'

/**
 * Historial de peso y métricas corporales de un socio.
 * Permite calcular IMC, % grasa, evolución en el tiempo y mostrar gráficos.
 */
export const weightHistory = pgTable(
  'weight_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    /** Peso en kg */
    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
    /** Altura en cm (opcional – si no se llena, se usa la del último registro) */
    heightCm: numeric('height_cm', { precision: 5, scale: 1 }),
    /** % de grasa corporal (estimado o medido) */
    bodyFatPercent: numeric('body_fat_percent', { precision: 5, scale: 2 }),
    /** Masa muscular en kg (estimada) */
    muscleMassKg: numeric('muscle_mass_kg', { precision: 5, scale: 2 }),
    /** Foto URL/base64 de progreso (opcional) */
    photoUrl: text('photo_url'),
    /** Notas del registro */
    notes: text('notes'),
    /** Quién registró (puede ser el trainer o recepcionista) */
    recordedByUserId: text('recorded_by_user_id').references(() => users.id),
    recordedAt: timestamp('recorded_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('weight_history_member_id_idx').on(table.memberId),
    index('weight_history_recorded_at_idx').on(table.recordedAt),
  ],
)
