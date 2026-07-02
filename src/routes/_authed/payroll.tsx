import { createFileRoute, redirect } from '@tanstack/react-router'
import { PayrollPage } from '#/features/employees/payroll-page.tsx'

export const Route = createFileRoute('/_authed/payroll')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: PayrollPage,
})
