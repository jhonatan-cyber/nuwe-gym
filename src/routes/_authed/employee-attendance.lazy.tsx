import { createLazyFileRoute } from '@tanstack/react-router'
import { AttendancePage } from '#/features/employees'

export const Route = createLazyFileRoute('/_authed/employee-attendance')({
  component: AttendancePage,
})
