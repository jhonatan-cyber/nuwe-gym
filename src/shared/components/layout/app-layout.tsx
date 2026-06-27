import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden font-sans relative">
      <style>{`
        @keyframes bg-blob-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(120px, -60px) scale(1.08); }
          50% { transform: translate(60px, 80px) scale(0.92); }
          75% { transform: translate(-60px, 40px) scale(1.04); }
        }
        @keyframes bg-blob-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-100px, -80px) scale(1.12); }
          66% { transform: translate(80px, 60px) scale(0.88); }
        }
        @keyframes bg-blob-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(80px, 100px) scale(1.05); }
          40% { transform: translate(-40px, -100px) scale(0.95); }
          60% { transform: translate(-100px, 40px) scale(1.08); }
          80% { transform: translate(60px, -40px) scale(0.92); }
        }
      `}</style>
      <div
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-200px] left-[-200px] size-[550px] rounded-full bg-indigo-500/6 dark:bg-indigo-500/4 blur-[120px]"
          style={{ animation: 'bg-blob-1 35s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-[-250px] right-[-200px] size-[600px] rounded-full bg-purple-500/6 dark:bg-purple-500/4 blur-[140px]"
          style={{ animation: 'bg-blob-2 45s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-sky-500/5 dark:bg-sky-500/3 blur-[160px]"
          style={{ animation: 'bg-blob-3 55s ease-in-out infinite' }}
        />
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-6 left-6 z-30 flex size-9 items-center justify-center rounded-lg border border-border/10 bg-card/85 backdrop-blur-md text-foreground shadow-md transition-all hover:bg-accent hover:text-accent-foreground md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      <AppSidebar
        role={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative pl-4 md:pl-[102px] p-4 pb-0">
        <AppHeader
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userImage={userImage}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6 scrollbar-none">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <Toaster richColors position="top-center" />
    </div>
  )
}
