import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/shared/components/ui/avatar'

interface AppHeaderProps {
  userId?: string
  userName?: string
  userEmail?: string
  userRole?: string
  userImage?: string | null
}

export function AppHeader({
  userName,
  userImage,
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Cambiar tema"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      <Avatar className="size-8 shadow-sm">
        {userImage && <AvatarImage src={userImage} alt={userName} />}
        <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
          {userName?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}


