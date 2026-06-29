import { Moon, Sun, User, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from '@tanstack/react-router'
import { authClient } from '#/shared/lib/auth-client.ts'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/shared/components/ui/dropdown-menu'
import { BranchSelector } from '#/features/branches/branch-selector.tsx'

interface AppHeaderProps {
  userId?: string
  userName?: string
  userEmail?: string
  userRole?: string
  userImage?: string | null
}

export function AppHeader({ userName, userImage, userEmail }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const handleLogout = async () => {
    try {
      await authClient.signOut()
    } catch (error) {
      console.error('Error al cerrar sesión', error)
    }
  }

  return (
    <div className="absolute top-6 right-6 z-50 flex items-center gap-1.5">
      <BranchSelector />

      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Cambiar tema"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none transition-transform active:scale-95">
            <Avatar className="size-8 shadow-sm cursor-pointer hover:opacity-90">
              {userImage && <AvatarImage src={userImage} alt={userName} />}
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-1 border-border/10 bg-card/95 backdrop-blur-md">
          <DropdownMenuLabel className="font-normal flex flex-col gap-1 p-2">
            <p className="text-sm font-bold leading-none text-foreground">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/10" />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="w-full flex items-center gap-2 cursor-pointer">
              <User className="size-4 text-muted-foreground" />
              <span>Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="w-full flex items-center gap-2 cursor-pointer">
              <SettingsIcon className="size-4 text-muted-foreground" />
              <span>Configuración</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/10" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
