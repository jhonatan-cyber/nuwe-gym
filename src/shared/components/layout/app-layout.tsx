import { Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset } from '#/shared/components/ui/sidebar'
import { Toaster } from '#/shared/components/ui/sonner'
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

export function AppLayout({ userId, userName, userEmail, userRole, userImage }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={userRole} />
      <SidebarInset>
        <AppHeader
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userImage={userImage}
        />
        <main className="flex-1 overflow-auto p-2 md:p-4 pt-4">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}


