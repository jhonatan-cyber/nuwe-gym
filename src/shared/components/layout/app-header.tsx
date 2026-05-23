import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from '@tanstack/react-router'
import { SidebarTrigger } from '#/shared/components/ui/sidebar'
import { Separator } from '#/shared/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '#/shared/components/ui/avatar'
import { Badge } from '#/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/shared/components/ui/dropdown-menu'
import { Button } from '#/shared/components/ui/button'
import { authClient } from '#/shared/lib/auth-client.ts'
import { NotificationBell } from '#/features/notifications/notification-bell.tsx'
import { BranchSelector } from '#/features/branches/branch-selector.tsx'

interface AppHeaderProps {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  userImage?: string | null
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  RECEPTIONIST: 'Recepcionista',
  TRAINER: 'Entrenador',
}

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  ADMIN: 'default',
  RECEPTIONIST: 'secondary',
  TRAINER: 'outline',
}

export function AppHeader({ userName, userEmail, userRole, userImage }: AppHeaderProps) {
  const router = useRouter()

  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const handleSignOut = async () => {
    await authClient.signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <header className="sticky top-2 z-20 mx-2 flex h-14 shrink-0 items-center gap-2 rounded-3xl border bg-background/80 backdrop-blur-lg shadow-sm px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <BranchSelector />
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="mr-2 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Cambiar tema"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>
      <NotificationBell userRole={userRole} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 gap-2 px-2">
            <Avatar className="size-7">
              {userImage && <AvatarImage src={userImage} alt={userName} />}
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {userName.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline-flex text-sm font-medium">
              {userName}
            </span>
            <Badge
              variant={ROLE_VARIANTS[userRole] ?? 'outline'}
              className="hidden sm:inline-flex text-[10px] px-1.5 py-0"
            >
              {ROLE_LABELS[userRole] ?? userRole}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.navigate({ to: '/profile' })}>
            <User className="mr-2 size-4" />
            <span>Mi perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 size-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
