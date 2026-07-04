import { createServerFn } from '@tanstack/react-start'
import { requireRole } from '#/shared/lib/server-utils.ts'
import { z } from 'zod'
import { requiredString, uuidField } from '#/shared/lib/schemas.ts'
import { computeChurnRisk, computeAllChurnRisks, generateChurnReengagementMessage } from './churn.ts'
import { detectInsights } from './trends.ts'
import {
  getProductRecommendations,
  getMemberBasedRecommendations,
  getAIRecommendationsForMember,
} from './market-basket.ts'
import { predictAttendance, getReorderSuggestions } from './prediction.ts'
import { executeNaturalQuery } from './query.ts'

// ── Churn Risk ──

export const getMemberChurnRisk = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ memberId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return computeChurnRisk(data.memberId)
  })

export const getChurnRisks = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
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
  .validator((data: unknown) =>
    z
      .object({
        productId: uuidField,
        limit: z.number().min(1).max(20).default(5),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return getProductRecommendations(data.productId, data.limit)
  })

export const getMemberRecommendations = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z
      .object({
        memberId: uuidField,
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
  .validator((data: unknown) =>
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
  .validator((data: unknown) =>
    z.object({ query: requiredString }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] } })
    return executeNaturalQuery(data.query)
  })

export const getAIRecommendations = createServerFn({ method: 'GET' })
  .validator((data: unknown) =>
    z
      .object({
        memberId: uuidField,
        limit: z.number().min(1).max(20).default(3),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return getAIRecommendationsForMember(data.memberId, data.limit)
  })

export const getAIChurnMessage = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ memberId: uuidField }).parse(data))
  .handler(async ({ data }) => {
    await requireRole({ data: { roles: ['ADMIN', 'RECEPTIONIST'] } })
    return generateChurnReengagementMessage(data.memberId)
  })
