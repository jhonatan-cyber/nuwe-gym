import { db } from '#/shared/db/index.ts'
import { sql } from 'drizzle-orm'
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
