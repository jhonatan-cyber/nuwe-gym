import { createLazyFileRoute } from '@tanstack/react-router'
import { VacationsPage } from '#/features/employees/vacations-page.tsx'

export const Route = createLazyFileRoute('/_authed/employee-vacations')({
  component: VacationsPage,
})
