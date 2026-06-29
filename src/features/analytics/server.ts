import { createServerFn } from '@tanstack/react-start'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { z } from 'zod'
import { computeChurnRisk, computeAllChurnRisks } from './churn.ts'
import { detectInsights } from './trends.ts'
import {
  getProductRecommendations,
  getMemberBasedRecommendations,
} from './market-basket.ts'
import { predictAttendance, getReorderSuggestions } from './prediction.ts'
import { executeNaturalQuery } from './query.ts'

// ── Churn Risk ──

export const getMemberChurnRisk = createServerFn({ method: 'GET' })
  .inputValidator((data) => z.object({ memberId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return computeChurnRisk(data.memberId)
  })

export const getChurnRisks = createServerFn({ method: 'GET' })
  .inputValidator((data) =>
    z.object({ limit: z.number().min(1).max(100).default(20) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return computeAllChurnRisks(data.limit)
  })

// ── Smart Insights ──

export const getInsights = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return detectInsights()
  },
)

// ── Product Recommendations ──

export const getRecommendations = createServerFn({ method: 'GET' })
  .inputValidator((data) =>
    z
      .object({
        productId: z.string().uuid(),
        limit: z.number().min(1).max(20).default(5),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return getProductRecommendations(data.productId, data.limit)
  })

export const getMemberRecommendations = createServerFn({ method: 'GET' })
  .inputValidator((data) =>
    z
      .object({
        memberId: z.string().uuid(),
        limit: z.number().min(1).max(20).default(5),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return getMemberBasedRecommendations(data.memberId, data.limit)
  })

// ── Attendance Forecast ──

export const getAttendanceForecast = createServerFn({ method: 'GET' })
  .inputValidator((data) =>
    z.object({ days: z.number().min(1).max(30).default(7) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return predictAttendance(data.days)
  })

// ── Reorder Suggestions ──

export const getReorderSuggestionsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return getReorderSuggestions()
  },
)

// ── Natural Language Query ──

export const askAnalytics = createServerFn({ method: 'GET' })
  .inputValidator((data) =>
    z.object({ query: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return executeNaturalQuery(data.query)
  })
