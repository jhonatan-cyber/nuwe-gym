export type ApiError = Error

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ActionResponse {
  success: boolean
  message?: string
}
