import { createFileRoute } from '@tanstack/react-router'
import { QRCodesPage } from '#/features/qr-codes/qr-codes-page.tsx'

export const Route = createFileRoute('/_authed/qr-codes')({
  component: QRCodesRoute,
})

function QRCodesRoute() {
  const { userRole } = Route.useRouteContext()
  return <QRCodesPage userRole={userRole} />
}
