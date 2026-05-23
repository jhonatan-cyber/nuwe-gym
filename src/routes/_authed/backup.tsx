import { createFileRoute, redirect } from '@tanstack/react-router'
import { BackupPage } from '#/features/backup/backup-page.tsx'

export const Route = createFileRoute('/_authed/backup')({
  beforeLoad: ({ context }) => {
    if (context.userRole !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: BackupPage,
})
