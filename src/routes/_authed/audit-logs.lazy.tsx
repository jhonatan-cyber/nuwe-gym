import { createLazyFileRoute } from '@tanstack/react-router'
import { AuditLogsPage } from '#/features/audit-logs/audit-logs-page.tsx'

export const Route = createLazyFileRoute('/_authed/audit-logs')({
  component: AuditLogsPage,
})
