import { db } from '#/shared/db/index.ts'
import { sql } from 'drizzle-orm'
import type { QueryResult } from './types.ts'

type QueryPattern = {
  patterns: RegExp[]
  intent: string
  execute: () => Promise<string>
}

async function queryOne(sqlQuery: ReturnType<typeof sql>): Promise<any> {
  const result = await db.execute(sqlQuery)
  return (result as any).rows?.[0]
}

const patterns: QueryPattern[] = [
  {
    patterns: [
      /cuantos? (socios?|miembros?|miembras?) (nuevos?|registrados?|activos?)/i,
      /cuantos? socios? hay/i,
      /total (de )?socios?/i,
    ],
    intent: 'total_members',
    execute: async () => {
      const row = await queryOne(sql`SELECT COUNT(*)::int as c FROM members`)
      return `Hay ${row?.c ?? 0} socios registrados en total.`
    },
  },
  {
    patterns: [
      /socios? (activos?|con membresia (activa|vigente))/i,
    ],
    intent: 'active_members',
    execute: async () => {
      const row = await queryOne(
        sql`SELECT COUNT(*)::int as c FROM members WHERE status = 'ACTIVE'`,
      )
      return `${row?.c ?? 0} socios tienen estado activo.`
    },
  },
  {
    patterns: [
      /check(-| )?ins? (hoy|de hoy|del dia)/i,
      /cuantos? (checkins?|check(-| )?ins?) (hubo|hay) hoy/i,
      /asistencia (de )?hoy/i,
    ],
    intent: 'checkins_today',
    execute: async () => {
      const row = await queryOne(
        sql`SELECT COUNT(*)::int as c FROM check_ins WHERE checked_in_at >= CURRENT_DATE`,
      )
      return `Hoy hubo ${row?.c ?? 0} check-ins.`
    },
  },
  {
    patterns: [
      /producto mas vendido/i,
      /cual es el producto (mas |que )?se vende (mas )?/i,
      /top producto/i,
    ],
    intent: 'top_product',
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
    patterns: [
      /ingresos? (de )?hoy/i,
      /cuanto se (vendio|recaudo) hoy/i,
      /ventas? de hoy/i,
      /caja (de )?hoy/i,
    ],
    intent: 'sales_today',
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
    patterns: [
      /productos? (con |con )?stock bajo/i,
      /que (hay que |)reponer/i,
      /stock (critico|minimo|bajo)/i,
    ],
    intent: 'low_stock',
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
    patterns: [
      /suscripciones? (que |por )?vencer/i,
      /vencimientos? (proximos?|next 7 dias)/i,
      /cuantas? suscripciones? vencen/i,
    ],
    intent: 'expiring',
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
    patterns: [
      /socios? (en )?riesgo/i,
      /churn/i,
      /posibles? (perdidas?|abandonos?)/i,
    ],
    intent: 'churn_risk',
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

export async function executeNaturalQuery(
  input: string,
): Promise<QueryResult> {
  for (const p of patterns) {
    for (const regex of p.patterns) {
      if (regex.test(input)) {
        try {
          const answer = await p.execute()
          return {
            query: input,
            intent: p.intent,
            answer,
          }
        } catch {
          return {
            query: input,
            intent: p.intent,
            answer: 'Ocurrio un error al procesar la consulta.',
          }
        }
      }
    }
  }

  return {
    query: input,
    intent: 'unknown',
    answer:
      'No entendi la consulta. Probá preguntar: "cuantos socios hay", "check-ins hoy", "producto mas vendido", "stock bajo", o "socios en riesgo".',
  }
}
