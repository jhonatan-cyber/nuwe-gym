import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { productCategories } from '#/shared/db/schema/product-categories.ts'
import { eq } from 'drizzle-orm'
import { createCategory, cleanDatabase } from '../factories.ts'

beforeAll(async () => {
  await cleanDatabase()
})

describe('Product Categories', () => {
  it('should create and verify', async () => {
    const cat = await createCategory({ name: 'Suplementos' })
    expect(cat.name).toBe('Suplementos')
  })

  it('should update name and isActive', async () => {
    const cat = await createCategory({ name: 'Original' })
    await db
      .update(productCategories)
      .set({ name: 'Modificado', isActive: false })
      .where(eq(productCategories.id, cat.id))
    const updated = await db.query.productCategories.findFirst({
      where: eq(productCategories.id, cat.id),
    })
    expect(updated!.name).toBe('Modificado')
    expect(updated!.isActive).toBe(false)
  })

  it('should list categories', async () => {
    await createCategory()
    await createCategory()
    const all = await db.query.productCategories.findMany()
    expect(all.length).toBeGreaterThanOrEqual(2)
  })

  it('should create with description', async () => {
    const cat = await createCategory({
      name: 'Cat Desc',
      description: 'una descripcion',
    })
    expect(cat.description).toBe('una descripcion')
  })
})
