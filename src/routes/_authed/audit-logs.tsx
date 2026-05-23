import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuditLogsPage } from '#/features/audit-logs/audit-logs-page.tsx'

export const Route = createFileRoute('/_authed/audit-logs')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: AuditLogsPage,
})
