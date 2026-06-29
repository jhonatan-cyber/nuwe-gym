import { db } from '#/shared/db/index.ts'
import { sql } from 'drizzle-orm'
import { getGroq, GROQ_MODEL } from '#/shared/lib/ai.ts'
import type { QueryResult } from './types.ts'

type QueryIntent = {
  name: string
  patterns: RegExp[]
  description: string
  execute: () => Promise<string>
}

const intents: QueryIntent[] = [
  {
    name: 'total_members',
    patterns: [
      /cuantos? (socios?|miembros?|miembras?) (nuevos?|registrados?|activos?)/i,
      /cuantos? socios? hay/i,
      /total (de )?socios?/i,
    ],
    description: 'Total number of registered members in the gym',
    execute: async () => {
      const row = await queryOne(sql`SELECT COUNT(*)::int as c FROM members`)
      return `Hay ${row?.c ?? 0} socios registrados en total.`
    },
  },
  {
    name: 'active_members',
    patterns: [
      /socios? (activos?|con membresia (activa|vigente))/i,
    ],
    description: 'Number of members with ACTIVE status',
    execute: async () => {
      const row = await queryOne(
        sql`SELECT COUNT(*)::int as c FROM members WHERE status = 'ACTIVE'`,
      )
      return `${row?.c ?? 0} socios tienen estado activo.`
    },
  },
  {
    name: 'checkins_today',
    patterns: [
      /check(-| )?ins? (hoy|de hoy|del dia)/i,
      /cuantos? (checkins?|check(-| )?ins?) (hubo|hay) hoy/i,
      /asistencia (de )?hoy/i,
      /cuanta? gente (entro|vino|asistio) hoy/i,
    ],
    description: 'Number of check-ins registered today',
    execute: async () => {
      const row = await queryOne(
        sql`SELECT COUNT(*)::int as c FROM check_ins WHERE checked_in_at >= CURRENT_DATE`,
      )
      return `Hoy hubo ${row?.c ?? 0} check-ins.`
    },
  },
  {
    name: 'top_product',
    patterns: [
      /producto mas vendido/i,
      /cual es el producto (mas |que )?se vende (mas )?/i,
      /top producto/i,
      /que (es )?lo (que )?mas se vende/i,
    ],
    description: 'Best-selling product by total units sold',
    execute: async () => {
      const row = await queryOne(
        sql`
          SELECT p.name, COALESCE(SUM(si.quantity), 0)::int as total
          FROM sale_items si
          JOIN products p ON p.id = si.product_id
          GROUP BY p.name
          ORDER BY total DESC
          LIMIT 1
        `,
      )
      return row
        ? `El producto mas vendido es "${row.name}" con ${row.total} unidades.`
        : 'Aun no hay ventas registradas.'
    },
  },
  {
    name: 'sales_today',
    patterns: [
      /ingresos? (de )?hoy/i,
      /cuanto se (vendio|recaudo) hoy/i,
      /ventas? de hoy/i,
      /caja (de )?hoy/i,
    ],
    description: 'Total sales revenue for today',
    execute: async () => {
      const row = await queryOne(
        sql`
          SELECT COALESCE(SUM(total::numeric), 0)::float as total
          FROM sales
          WHERE created_at >= CURRENT_DATE
        `,
      )
      return `Las ventas de hoy suman Bs. ${Number(row?.total ?? 0).toFixed(2)}.`
    },
  },
  {
    name: 'low_stock',
    patterns: [
      /productos? (con |con )?stock bajo/i,
      /que (hay que |)reponer/i,
      /stock (critico|minimo|bajo)/i,
    ],
    description: 'Products where current stock is at or below minimum',
    execute: async () => {
      const row = await queryOne(
        sql`
          SELECT COUNT(*)::int as c
          FROM products
          WHERE is_active = true AND stock_current <= stock_minimum
        `,
      )
      if (row?.c === 0) return 'No hay productos con stock bajo.'
      return `${row?.c} productos tienen stock por debajo del minimo.`
    },
  },
  {
    name: 'expiring_subscriptions',
    patterns: [
      /suscripciones? (que |por )?vencer/i,
      /vencimientos? (proximos?|next 7 dias)/i,
      /cuantas? suscripciones? vencen/i,
    ],
    description: 'Active subscriptions expiring in the next 7 days',
    execute: async () => {
      const row = await queryOne(
        sql`
          SELECT COUNT(*)::int as c
          FROM subscriptions
          WHERE status = 'ACTIVE'
          AND end_date >= CURRENT_DATE
          AND end_date <= CURRENT_DATE + INTERVAL '7 days'
        `,
      )
      if (row?.c === 0) return 'No hay suscripciones por vencer en los proximos 7 dias.'
      return `${row?.c} suscripciones vencen en los proximos 7 dias.`
    },
  },
  {
    name: 'churn_risk',
    patterns: [
      /socios? (en )?riesgo/i,
      /churn/i,
      /posibles? (perdidas?|abandonos?)/i,
    ],
    description: 'Active members who have not checked in for more than 14 days',
    execute: async () => {
      const row = await queryOne(
        sql`
          SELECT COUNT(*)::int as c FROM (
            SELECT m.id
            FROM members m
            WHERE m.status = 'ACTIVE'
            AND EXISTS (
              SELECT 1 FROM subscriptions s
              WHERE s.member_id = m.id AND s.status = 'ACTIVE'
              AND s.start_date <= NOW() AND s.end_date >= NOW()
            )
            AND (
              SELECT MAX(checked_in_at) FROM check_ins WHERE member_id = m.id
            ) < CURRENT_DATE - INTERVAL '14 days'
          ) sub
        `,
      )
      if (row?.c === 0) return 'No hay socios en riesgo de abandono.'
      return `${row?.c} socios activos no vienen hace mas de 14 dias y podrian estar en riesgo de abandono.`
    },
  },
]

async function queryOne(sqlQuery: ReturnType<typeof sql>): Promise<any> {
  const result = await db.execute(sqlQuery)
  return (result as any).rows?.[0]
}

// ── Groq tools (function calling) ──

const groqTools: Record<string, () => Promise<string>> = {}
const groqToolDefs: any[] = []

for (const intent of intents) {
  const fnName = intent.name
  groqTools[fnName] = intent.execute
  groqToolDefs.push({
    type: 'function',
    function: {
      name: fnName,
      description: intent.description,
      parameters: { type: 'object', properties: {} },
    },
  })
}

async function groqFallback(input: string): Promise<QueryResult> {
  try {
    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de inteligencia de negocios para un gimnasio llamado Tainix.
Tu trabajo es responder preguntas sobre los datos del gimnasio.

Tienes acceso a estas funciones de consulta:
${intents.map((i) => `  - ${i.name}: ${i.description}`).join('\n')}

REGLAS:
- Si la pregunta coincide con alguna funcion DISPONIBLE, llama a esa funcion.
- Si la pregunta NO coincide con ninguna funcion, responde de forma conversacional con lo que sepas sobre el gimnasio. Se breve y directo.
- Responde SIEMPRE en español.',
`,
        },
        { role: 'user', content: input },
      ],
      tools: groqToolDefs,
      tool_choice: 'auto',
      temperature: 0.1,
      max_tokens: 300,
    })

    const choice = completion.choices?.[0]
    const toolCall = choice?.message?.tool_calls?.[0]

    if (toolCall?.function?.name && groqTools[toolCall.function.name]) {
      const answer = await groqTools[toolCall.function.name]()
      return {
        query: input,
        intent: `ai:${toolCall.function.name}`,
        answer,
      }
    }

    const text = choice?.message?.content?.trim()
    if (text) {
      return {
        query: input,
        intent: 'ai:conversational',
        answer: text,
      }
    }

    return {
      query: input,
      intent: 'ai:error',
      answer: 'No entendi la consulta, intenta de nuevo.',
    }
  } catch (err) {
    console.error('Groq query failed:', err)
    return {
      query: input,
      intent: 'ai:error',
      answer:
        'Ocurrio un error al procesar la consulta con IA. Asegurate de que GROQ_API_KEY este configurada.',
    }
  }
}

// ── Main entry point ──

export async function executeNaturalQuery(
  input: string,
): Promise<QueryResult> {
  // Step 1: try regex patterns first (instant, free)
  for (const intent of intents) {
    for (const regex of intent.patterns) {
      if (regex.test(input)) {
        try {
          const answer = await intent.execute()
          return { query: input, intent: intent.name, answer }
        } catch {
          return {
            query: input,
            intent: intent.name,
            answer: 'Ocurrio un error al procesar la consulta.',
          }
        }
      }
    }
  }

  // Step 2: Groq-powered fallback
  return groqFallback(input)
}
