export interface ChurnRisk {
  memberId: string
  memberName: string
  score: number // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  factors: string[]
  lastCheckIn: Date | null
  daysSinceLastCheckIn: number | null
}

export interface Insight {
  type: 'trend_up' | 'trend_down' | 'anomaly' | 'opportunity' | 'alert'
  module: 'members' | 'checkins' | 'sales' | 'products' | 'inventory'
  title: string
  description: string
  metric: string
  change: number // percentage
  actionable: boolean
}

export interface ProductRecommendation {
  productId: string
  productName: string
  productPrice: string
  reason: string
  score: number
}

export interface AttendanceForecast {
  date: string
  predicted: number
  lowerBound: number
  upperBound: number
}

export interface ReorderSuggestion {
  productId: string
  productName: string
  sku: string
  currentStock: number
  reorderPoint: number
  recommendedOrder: number
  averageDailySales: number
  leadTimeDays: number
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface QueryResult {
  query: string
  intent: string
  sql?: string
  answer: string
}
