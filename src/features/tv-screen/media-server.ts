import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { tvMedia, tvTickerMessages } from '#/shared/db/schema/tv-media.ts'
import { eq, asc } from 'drizzle-orm'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { z } from 'zod'
import { requiredString } from '#/shared/lib/schemas.ts'

// ── TV Media CRUD ──

export const getTvMedia = createServerFn({ method: 'GET' }).handler(async () => {
  return db
    .select()
    .from(tvMedia)
    .where(eq(tvMedia.isActive, true))
    .orderBy(asc(tvMedia.displayOrder))
})

export const addTvMedia = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({
      imageUrl: requiredString,
      caption: z.string().optional(),
      displayOrder: z.number().int().min(0).default(0),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    const [media] = await db
      .insert(tvMedia)
      .values({ imageUrl: data.imageUrl, caption: data.caption, displayOrder: data.displayOrder })
      .returning()
    return media
  })

export const removeTvMedia = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: requiredString }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    await db.delete(tvMedia).where(eq(tvMedia.id, data.id))
    return { success: true }
  })

// ── Ticker Messages CRUD ──

export const getTickerMessages = createServerFn({ method: 'GET' }).handler(async () => {
  return db
    .select()
    .from(tvTickerMessages)
    .where(eq(tvTickerMessages.isActive, true))
    .orderBy(asc(tvTickerMessages.displayOrder))
})

export const addTickerMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ message: requiredString, displayOrder: z.number().int().min(0).default(0) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    const [msg] = await db
      .insert(tvTickerMessages)
      .values({ message: data.message, displayOrder: data.displayOrder })
      .returning()
    return msg
  })

export const removeTickerMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: requiredString }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN'] } })
    await db.delete(tvTickerMessages).where(eq(tvTickerMessages.id, data.id))
    return { success: true }
  })

// ── Get all TV data for the TV page (media + tickers) ──

export const getTvMediaAndTickers = createServerFn({ method: 'GET' }).handler(async () => {
  const [media, tickers] = await Promise.all([
    getTvMedia(),
    getTickerMessages(),
  ])
  return { media, tickers }
})
