import type { getBranches } from '#/features/branches/server.ts'

export type Branch = Awaited<ReturnType<typeof getBranches>>[number]

export type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

export interface BranchForm {
  name: string
  address: string
  phone: string
  email: string
  openingTime: string
  closingTime: string
}

export const EMPTY_BRANCH_FORM: BranchForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  openingTime: '08:00',
  closingTime: '22:00',
}
