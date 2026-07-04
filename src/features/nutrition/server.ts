import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { nutritionPlans } from '#/shared/db/schema/nutrition-plans.ts'
import { weightHistory } from '#/shared/db/schema/weight-history.ts'
import { eq, desc, and } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { getAuditContext } from '#/shared/lib/audit-context.ts'
import { z } from 'zod'
import { uuidField, requiredString, optionalString } from '#/shared/lib/schemas.ts'
import { getGroq, GROQ_MODEL } from '#/shared/lib/ai.ts'

// ── Schemas ───────────────────────────────────────────────────────

const weightEntrySchema = z.object({
  memberId: uuidField,
  weightKg: z.number().min(1).max(500),
  heightCm: z.number().min(50).max(300).optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  muscleMassKg: z.number().min(0).max(200).optional(),
  notes: optionalString,
  photoUrl: optionalString,
})

const nutritionPlanSchema = z.object({
  memberId: uuidField,
  title: requiredString,
  goal: optionalString,
  targetCalories: z.number().int().min(0).optional(),
  proteinGrams: z.number().min(0).optional(),
  carbsGrams: z.number().min(0).optional(),
  fatGrams: z.number().min(0).optional(),
  mealsPerDay: z.number().int().min(1).max(10).optional(),
  planContent: optionalString,
  isAiGenerated: z.boolean().optional(),
})

const generateNutritionPlanSchema = z.object({
  memberId: uuidField,
  memberName: requiredString,
  age: z.number().int().min(10).max(100),
  gender: z.string(),
  weightKg: z.number(),
  heightCm: z.number(),
  goal: z.string(),
  restrictions: optionalString,
  mealsPerDay: z.number().int().min(1).max(10).optional(),
  budget: optionalString,
})

// ── Weight History ────────────────────────────────────────────────

export const getWeightHistory = createServerFn({ method: 'GET' })
  .validator(z.object({ memberId: uuidField }))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'TRAINER', 'RECEPTIONIST'] } })
    return await db.query.weightHistory.findMany({
      where: eq(weightHistory.memberId, data.memberId),
      orderBy: [desc(weightHistory.recordedAt)],
      with: { recordedBy: true },
    })
  })

export const addWeightEntry = createServerFn({ method: 'POST' })
  .validator((data) => weightEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'TRAINER', 'RECEPTIONIST'] } })

    const [entry] = await db
      .insert(weightHistory)
      .values({
        memberId: data.memberId,
        weightKg: data.weightKg.toString(),
        heightCm: data.heightCm?.toString(),
        bodyFatPercent: data.bodyFatPercent?.toString(),
        muscleMassKg: data.muscleMassKg?.toString(),
        notes: data.notes,
        photoUrl: data.photoUrl || null,
        recordedByUserId: session.user.id,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'WEIGHT_ENTRY',
      entityId: entry.id,
      description: `Registró peso ${data.weightKg}kg para socio ${data.memberId}`,
    })

    return entry
  })

export const deleteWeightEntry = createServerFn({ method: 'POST' })
  .validator(z.object({ id: uuidField }))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'TRAINER'] } })
    const [entry] = await db
      .delete(weightHistory)
      .where(eq(weightHistory.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'WEIGHT_ENTRY',
      entityId: data.id,
      description: `Eliminó registro de peso #${data.id}`,
    })
    return entry
  })

// ── Nutrition Plans ───────────────────────────────────────────────

export const getNutritionPlans = createServerFn({ method: 'GET' })
  .validator(z.object({ memberId: uuidField }))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'TRAINER', 'RECEPTIONIST'] } })
    return await db.query.nutritionPlans.findMany({
      where: eq(nutritionPlans.memberId, data.memberId),
      orderBy: [desc(nutritionPlans.createdAt)],
      with: { createdBy: true },
    })
  })

export const createNutritionPlan = createServerFn({ method: 'POST' })
  .validator((data) => nutritionPlanSchema.parse(data))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'TRAINER'] } })

    // Desactivar planes anteriores
    await db
      .update(nutritionPlans)
      .set({ isActive: false })
      .where(
        and(
          eq(nutritionPlans.memberId, data.memberId),
          eq(nutritionPlans.isActive, true),
        ),
      )

    const [plan] = await db
      .insert(nutritionPlans)
      .values({
        memberId: data.memberId,
        title: data.title,
        goal: data.goal,
        targetCalories: data.targetCalories,
        proteinGrams: data.proteinGrams?.toString(),
        carbsGrams: data.carbsGrams?.toString(),
        fatGrams: data.fatGrams?.toString(),
        mealsPerDay: data.mealsPerDay ?? 4,
        planContent: data.planContent,
        isAiGenerated: data.isAiGenerated ?? false,
        isActive: true,
        createdByUserId: session.user.id,
      })
      .returning()

    createAuditLog({
      ...getAuditContext(session),
      action: 'CREATE',
      entityType: 'NUTRITION_PLAN',
      entityId: plan.id,
      description: `Creó plan nutricional "${plan.title}" para socio ${data.memberId}`,
    })

    return plan
  })

export const deleteNutritionPlan = createServerFn({ method: 'POST' })
  .validator(z.object({ id: uuidField }))
  .handler(async ({ data }) => {
    const session = await requireRole({ data: { roles: ['ADMIN', 'TRAINER'] } })
    const [plan] = await db
      .delete(nutritionPlans)
      .where(eq(nutritionPlans.id, data.id))
      .returning()
    createAuditLog({
      ...getAuditContext(session),
      action: 'DELETE',
      entityType: 'NUTRITION_PLAN',
      entityId: data.id,
      description: `Eliminó plan nutricional #${data.id}`,
    })
    return plan
  })

// ── IA: Generar plan alimenticio ──────────────────────────────────

export const generateAINutritionPlan = createServerFn({ method: 'POST' })
  .validator((data) => generateNutritionPlanSchema.parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'TRAINER'] } })

    const imc = data.weightKg / Math.pow(data.heightCm / 100, 2)
    const imcStatus =
      imc < 18.5
        ? 'bajo peso'
        : imc < 25
          ? 'normopeso'
          : imc < 30
            ? 'sobrepeso'
            : 'obesidad'

    const groq = getGroq()
    const systemPrompt = `Sos un nutricionista deportivo experto en planes alimenticios para gimnasios.
Tu tarea es generar un plan alimenticio semanal detallado para un socio de gimnasio.
REGLAS:
- Responde SIEMPRE en español.
- El plan debe ser realista, práctico y con alimentos accesibles.
- Estructura el plan en comidas por día (desayuno, almuerzo, merienda, cena, etc.).
- Incluye al inicio un resumen con: calorías objetivo/día, proteínas, carbohidratos y grasas en gramos.
- Indica si el presupuesto impacta en las opciones de alimentos.
- Máximo 600 palabras.`

    const userPrompt = `Datos del socio:
- Nombre: ${data.memberName}
- Edad: ${data.age} años
- Género: ${data.gender === 'MALE' ? 'Masculino' : 'Femenino'}
- Peso actual: ${data.weightKg} kg
- Altura: ${data.heightCm} cm
- IMC: ${imc.toFixed(1)} (${imcStatus})
- Objetivo: ${data.goal}
- Comidas por día: ${data.mealsPerDay ?? 4}
${data.restrictions ? `- Restricciones/alergias: ${data.restrictions}` : ''}
${data.budget ? `- Presupuesto/semana: ${data.budget}` : ''}

Generá un plan alimenticio completo y detallado para esta persona.`

    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1200,
      })

      return {
        content: completion.choices?.[0]?.message?.content || 'No se pudo generar el plan.',
        imc: parseFloat(imc.toFixed(1)),
        imcStatus,
      }
    } catch (err) {
      console.error('[generateAINutritionPlan] Error Groq:', err)
      throw new Error('Error al generar el plan con IA. Verificá la GROQ_API_KEY.')
    }
  })
