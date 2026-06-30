import { db } from '#/shared/db/index.ts'
import { sql } from 'drizzle-orm'
import { getGroq, GROQ_MODEL } from '#/shared/lib/ai.ts'
import type { ProductRecommendation } from './types.ts'

export async function getProductRecommendations(
  productId: string,
  limit = 5,
): Promise<ProductRecommendation[]> {
  const result = await db.execute(
    sql`
      WITH product_sales AS (
        SELECT DISTINCT si.sale_id
        FROM sale_items si
        WHERE si.product_id = ${productId}
      ),
      co_occurrences AS (
        SELECT
          si2.product_id,
          COUNT(*) as times_bought_together
        FROM sale_items si2
        JOIN product_sales ps ON ps.sale_id = si2.sale_id
        WHERE si2.product_id != ${productId}
        GROUP BY si2.product_id
        ORDER BY times_bought_together DESC
        LIMIT ${limit}
      )
      SELECT
        p.id,
        p.name,
        p.sale_price,
        co.times_bought_together,
        (SELECT COUNT(*) FROM product_sales) as total_product_sales
      FROM co_occurrences co
      JOIN products p ON p.id = co.product_id
      WHERE p.is_active = true
      ORDER BY co.times_bought_together DESC
    `,
  )

  const rows: any[] = (result as any).rows ?? []
  return rows.map((row) => ({
    productId: row.id,
    productName: row.name,
    productPrice: row.sale_price,
    reason: `Quienes compraron esto tambien compraron "${row.name}"`,
    score: Math.round(
      (Number(row.times_bought_together) / Number(row.total_product_sales)) *
        100,
    ),
  }))
}

export async function getMemberBasedRecommendations(
  memberId: string,
  limit = 5,
): Promise<ProductRecommendation[]> {
  const result = await db.execute(
    sql`
      WITH member_products AS (
        SELECT DISTINCT si.product_id
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.member_id = ${memberId}
      ),
      similar_members AS (
        SELECT s2.member_id
        FROM sale_items si2
        JOIN sales s2 ON s2.id = si2.sale_id
        WHERE si2.product_id IN (SELECT product_id FROM member_products)
        AND s2.member_id != ${memberId}
        GROUP BY s2.member_id
        HAVING COUNT(DISTINCT si2.product_id) >= 2
      ),
      recommendations AS (
        SELECT
          si3.product_id,
          COUNT(*) as relevance
        FROM sale_items si3
        JOIN sales s3 ON s3.id = si3.sale_id
        WHERE s3.member_id IN (SELECT member_id FROM similar_members)
        AND si3.product_id NOT IN (SELECT product_id FROM member_products)
        GROUP BY si3.product_id
        ORDER BY relevance DESC
        LIMIT ${limit}
      )
      SELECT p.id, p.name, p.sale_price, r.relevance
      FROM recommendations r
      JOIN products p ON p.id = r.product_id
      WHERE p.is_active = true
      ORDER BY r.relevance DESC
    `,
  )

  const rows: any[] = (result as any).rows ?? []
  return rows.map((row) => ({
    productId: row.id,
    productName: row.name,
    productPrice: row.sale_price,
    reason: `Recomendado para vos basado en compras de socios similares`,
    score: Number(row.relevance),
  }))
}

export async function getAIRecommendationsForMember(
  memberId: string,
  limit = 3,
): Promise<any[]> {
  // 1. Obtener historial del socio
  const salesResult = await db.execute(
    sql`
      SELECT p.name, si.quantity, s.created_at
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN products p ON p.id = si.product_id
      WHERE s.member_id = ${memberId}
      ORDER BY s.created_at DESC
      LIMIT 10
    `,
  )
  const history = salesResult.rows
    .map(
      (r: any) =>
        `${r.name} (x${r.quantity}) el ${new Date(
          r.created_at,
        ).toLocaleDateString()}`,
    )
    .join(', ')

  // 2. Obtener checkins del día
  const checkinsResult = await db.execute(
    sql`
      SELECT checked_in_at
      FROM check_ins
      WHERE member_id = ${memberId} AND checked_in_at >= CURRENT_DATE
      ORDER BY checked_in_at DESC
      LIMIT 1
    `,
  )
  const hasCheckedInToday = checkinsResult.rows.length > 0

  // 3. Obtener lista de productos activos disponibles con stock
  const productsResult = await db.execute(
    sql`
      SELECT id, name, sale_price, stock_current
      FROM products
      WHERE is_active = true AND stock_current > 0
      LIMIT 15
    `,
  )
  const availableProducts = productsResult.rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.sale_price,
    stock: p.stock_current,
  }))

  if (availableProducts.length === 0) return []

  // 4. Invocar a Groq para la recomendación inteligente
  const groq = getGroq()
  const systemPrompt = `Eres un asistente de ventas inteligente para un gimnasio.
Tu tarea es recomendar los mejores productos para un socio específico basándote en su historial de compras recientes y si asistió hoy al gimnasio.
Debes responder UNICAMENTE con un objeto JSON válido con la estructura:
{
  "recommendations": [
    {
      "productId": "ID del producto",
      "productName": "Nombre del producto",
      "productPrice": "Precio (número o string)",
      "reason": "Explicación corta (máx 80 caracteres) y conversacional de por qué se lo recomendás (ej: Ideal para recuperarte post-entreno hoy)"
    }
  ]
}
No agregues texto introductorio ni conclusiones. Solo el objeto JSON.`

  const userPrompt = `Socio ID: ${memberId}
Historial de compras: ${history || 'Ninguna compra registrada'}
¿Hizo check-in hoy?: ${hasCheckedInToday ? 'Sí' : 'No'}
Productos disponibles en inventario:
${JSON.stringify(availableProducts)}`

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 800,
    })

    const rawJson = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(rawJson)
    return (parsed.recommendations || []).slice(0, limit)
  } catch (err) {
    console.error('Error al generar recomendaciones con IA:', err)
    // Fallback a las heurísticas básicas de market-basket si falla la IA
    const fallback = await getMemberBasedRecommendations(memberId, limit)
    return fallback.map((f) => ({
      productId: f.productId,
      productName: f.productName,
      productPrice: f.productPrice,
      reason: f.reason,
    }))
  }
}
