import {
  uuid,
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { members } from './members.ts'
import { users } from './auth.ts'

/**
 * Plan nutricional asignado a un socio.
 * Generado manualmente por el trainer o mediante IA (Groq).
 */
export const nutritionPlans = pgTable(
  'nutrition_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** Objetivo: perder peso, ganar músculo, mantenimiento, etc. */
    goal: text('goal'),
    /** Calorías diarias objetivo */
    targetCalories: integer('target_calories'),
    /** Macros objetivo en gramos */
    proteinGrams: numeric('protein_grams', { precision: 6, scale: 1 }),
    carbsGrams: numeric('carbs_grams', { precision: 6, scale: 1 }),
    fatGrams: numeric('fat_grams', { precision: 6, scale: 1 }),
    /** Número de comidas por día */
    mealsPerDay: integer('meals_per_day').default(4),
    /** Contenido completo del plan (JSON con comidas/horarios o texto libre) */
    planContent: text('plan_content'),
    /** Si fue generado por IA */
    isAiGenerated: boolean('is_ai_generated').default(false),
    /** Si el plan está activo actualmente */
    isActive: boolean('is_active').default(true),
    createdByUserId: text('created_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('nutrition_plans_member_id_idx').on(table.memberId),
    index('nutrition_plans_is_active_idx').on(table.isActive),
  ],
)
