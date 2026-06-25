import { useState, useEffect } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff, Sun, Moon, Monitor } from 'lucide-react'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Button } from '#/shared/components/ui/button'
import { authClient } from '#/shared/lib/auth-client.ts'
import { getSession } from '#/shared/lib/server-utils.ts'
import { useTheme } from 'next-themes'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [email, setEmail] = useState('admin@gym.local')
  const [password, setPassword] = useState('Admin123*')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(result.error.message ?? 'Credenciales inválidas')
        return
      }

      router.navigate({ to: '/dashboard' })
    } catch {
      setError('Error al iniciar sesión. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {mounted && (
        <div className="absolute top-6 right-6 flex items-center gap-0.5 bg-muted/60 p-1 rounded-full border border-border/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex size-8 items-center justify-center rounded-full transition-all duration-200 ${
              theme === 'light'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Modo claro"
          >
            <Sun className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex size-8 items-center justify-center rounded-full transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Modo oscuro"
          >
            <Moon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex size-8 items-center justify-center rounded-full transition-all duration-200 ${
              theme === 'system'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Modo sistema"
          >
            <Monitor className="size-4" />
          </button>
        </div>
      )}
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-lg mb-4">
            GM
          </div>
          <h1 className="text-2xl font-bold text-foreground">GymManager POS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresá tus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@gym.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 px-6"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Contraseña
              </Label>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 px-6 pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold transition-all"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          GymManager POS v1.0
        </p>
      </div>
    </div>
  )
}
