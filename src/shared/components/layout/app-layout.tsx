import { Outlet } from '@tanstack/react-router'
import { Toaster } from '#/shared/components/ui/sonner.tsx'
import { AppSidebar } from './app-sidebar.tsx'
import { AppHeader } from './app-header.tsx'
import { PageTransition } from '#/shared/components/page-transition.tsx'
import type { UserRole } from '#/shared/lib/permissions.ts'

interface AppLayoutProps {
  userId: string
  userName: string
  userEmail: string
  userRole: UserRole
  userImage?: string | null
}

export function AppLayout({
  userId,
  userName,
  userEmail,
  userRole,
  userImage,
}: AppLayoutProps) {
  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden font-sans relative">
      <AppSidebar role={userRole} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative pl-[102px] p-4 pb-0">
        <AppHeader
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userImage={userImage}
        />

        <main className="flex-1 overflow-auto p-6 scrollbar-none">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  )
}
