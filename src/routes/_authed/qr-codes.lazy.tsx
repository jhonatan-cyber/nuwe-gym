import { createLazyFileRoute } from '@tanstack/react-router'
import { QRCodesPage } from '#/features/qr-codes/qr-codes-page.tsx'

function QRCodesRoute() {
  const { session } = Route.useRouteContext()
  return <QRCodesPage userRole={session.user.role} />
}

export const Route = createLazyFileRoute('/_authed/qr-codes')({
  component: QRCodesRoute,
})
