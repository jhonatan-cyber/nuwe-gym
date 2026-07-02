import type { getCorporateAccounts, getCorporateAccountById, getCorporateBillingReport } from './server.ts'

export type CorporateAccount = Awaited<ReturnType<typeof getCorporateAccounts>>[number]

export type CorporateAccountDetail = Awaited<ReturnType<typeof getCorporateAccountById>>

export type CorporateBillingReport = Awaited<ReturnType<typeof getCorporateBillingReport>>
