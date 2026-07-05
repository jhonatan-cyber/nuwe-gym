import { createLazyFileRoute } from '@tanstack/react-router'
import { CashRegisterPage } from '#/features/cash-register/cash-register-page.tsx'

export const Route = createLazyFileRoute('/_authed/cash-register')({
  component: CashRegisterPage,
})
