import { createFileRoute, redirect } from '@tanstack/react-router'
import { hasPermission } from '#/shared/lib/permissions.ts'
import { ExportPage } from '#/features/export/export-page.tsx'

export const Route = createFileRoute('/_authed/export')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.userRole, 'export:read')) {
      throw redirect({ to: '/' })
    }
  },
  component: ExportPage,
})
