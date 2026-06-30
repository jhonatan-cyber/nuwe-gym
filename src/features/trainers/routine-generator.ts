import { getGroq, GROQ_MODEL } from '#/shared/lib/ai.ts'

export interface ExerciseProposal {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
}

export interface RoutineDayProposal {
  dayName: string
  exercises: ExerciseProposal[]
}

export interface RoutineProposal {
  title: string
  notes: string
  days: RoutineDayProposal[]
}

export async function generateRoutineProposal(params: {
  age: number
  gender: string
  objectives: string
  experienceLevel: string
  weeklyDays: number
  limitations?: string
}): Promise<RoutineProposal> {
  const groq = getGroq()

  const systemPrompt = `Eres un entrenador personal experto y preparador físico de élite.
Tu tarea es diseñar un plan de entrenamiento (rutina) personalizado basado en los datos del miembro.
Debes responder UNICAMENTE con un objeto JSON válido que siga exactamente esta estructura:
{
  "title": "Nombre corto de la rutina (ej. Fuerza y Acondicionamiento)",
  "notes": "Recomendaciones generales, calentamiento o advertencias legales",
  "days": [
    {
      "dayName": "Nombre del día (ej. Día 1: Empuje / Tren Superior)",
      "exercises": [
        {
          "name": "Nombre del ejercicio",
          "sets": 4,
          "reps": "8-10 o RPE 8 (string)",
          "rest": "Tiempo de descanso (ej. 90s o 2 min)",
          "notes": "Indicación técnica corta (ej. Enfoque en la fase excéntrica)"
        }
      ]
    }
  ]
}

REGLAS DE NEGOCIO:
- Responde siempre en español.
- Adapta los ejercicios, volumen (series) e intensidad (repeticiones/RPE) al nivel de experiencia ("${params.experienceLevel}"), edad (${params.age} años) y limitaciones físicas ("${params.limitations || 'Ninguna'}").
- Divide el plan exactamente en ${params.weeklyDays} días de entrenamiento.
- Si hay limitaciones físicas, evita ejercicios de riesgo y ofrece alternativas seguras en las notas.
- NO agregues texto antes ni después del JSON. Solo devuelve el JSON.`

  const userPrompt = `Generar rutina para:
- Edad: ${params.age} años
- Género: ${params.gender}
- Nivel de experiencia: ${params.experienceLevel}
- Días por semana: ${params.weeklyDays}
- Objetivos principales: ${params.objectives}
- Limitaciones o lesiones: ${params.limitations || 'Ninguna'}`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1500
  })

  const rawJson = completion.choices[0].message.content || '{}'
  return JSON.parse(rawJson) as RoutineProposal
}
