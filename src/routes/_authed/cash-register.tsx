import { createFileRoute } from '@tanstack/react-router'
import { CashRegisterPage } from '#/features/cash-register/cash-register-page.tsx'

export const Route = createFileRoute('/_authed/cash-register')({
  component: CashRegisterPage,
})
