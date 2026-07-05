import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '#/shared/components/layout/app-layout.tsx'
import { getSession } from '#/shared/lib/server-utils.ts'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { session } = Route.useRouteContext()

  return (
    <AppLayout
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
    />
  )
}
