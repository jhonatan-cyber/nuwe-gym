import { createLazyFileRoute } from '@tanstack/react-router'
import { BackupPage } from '#/features/backup/backup-page.tsx'

export const Route = createLazyFileRoute('/_authed/backup')({
  component: BackupPage,
})
