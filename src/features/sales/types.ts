import type {
  getRecentSales,
  getDailySalesSummary,
} from '#/features/sales/server.ts'

export type Sale = Awaited<ReturnType<typeof getRecentSales>>[number]

export type PaymentMethod = 'CASH' | 'QR' | 'TRANSFER' | 'CARD'

export type StatusFilter = 'ALL' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'

export interface SaleStats {
  totalSales: number
  todaySales: number
  todayRevenue: number
  totalRevenue: number
}

export interface WeeklyDayRow {
  dayName: string
  thisWeekTotal: number
  thisWeekRevenue: number
  lastWeekTotal: number
  lastWeekRevenue: number
  changePercent: number | null
}

export interface WeeklyTotals {
  thisWeek: { total: number; revenue: number }
  lastWeek: { total: number; revenue: number }
  changePercent: number | null
}

export type DailySalesSummary = Awaited<ReturnType<typeof getDailySalesSummary>>
