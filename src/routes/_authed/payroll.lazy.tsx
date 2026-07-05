import { createLazyFileRoute } from '@tanstack/react-router'
import { PayrollPage } from '#/features/employees/payroll-page.tsx'

export const Route = createLazyFileRoute('/_authed/payroll')({
  component: PayrollPage,
})
