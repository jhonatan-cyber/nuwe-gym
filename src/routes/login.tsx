import { useState, useEffect } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Sun, Moon, Monitor, ArrowLeft, Shield, Smartphone } from 'lucide-react'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Button } from '#/shared/components/ui/button'
import { CountryCodeSelect } from '#/shared/components/ui/country-code-select.tsx'
import { authClient } from '#/shared/lib/auth-client.ts'
import { getSession } from '#/shared/lib/server-utils.ts'
import { useTheme } from 'next-themes'
import { checkDbEmpty, createInitialAdmin } from '#/features/users/setup.ts'
import { toast } from 'sonner'

function capitalizeEach(str: string) {
  return str.replace(
    /\w\S*/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  )
}

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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [dbEmpty, setDbEmpty] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupForm, setSetupForm] = useState({
    name: '',
    email: '',
    password: '',
    documentNumber: '',
    phone: '',
    address: '',
  })
  const [countryCode, setCountryCode] = useState('+591')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    setMounted(true)
    checkDbEmpty().then((res) => {
      setDbEmpty(res.isEmpty)
    })
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authClient.signIn.email({ email, password })

      // Check if 2FA is required first (can come in data or alongside an error)
      if ((result.data as Record<string, unknown> | undefined)?.twoFactorRedirect) {
        setTwoFactorRequired(true)
        setLoading(false)
        return
      }

      if (result.error) {
        setError(result.error.message ?? 'Credenciales inválidas')
        return
      }

      window.location.assign('/dashboard')
    } catch {
      setError('Error al iniciar sesión. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTwoFactorLoading(true)

    try {
      const result = await authClient.twoFactor.verifyTotp({ code: totpCode })

      if (result.error) {
        setError(result.error.message ?? 'Código inválido')
        return
      }

      window.location.assign('/dashboard')
    } catch {
      setError('Error al verificar el código. Intente nuevamente.')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSetupError('')
    setSetupLoading(true)

    try {
      await createInitialAdmin({
        data: { ...setupForm, phone: countryCode + phoneNumber },
      })
      toast.success('Administrador creado correctamente')
      setEmail(setupForm.email)
      setPassword(setupForm.documentNumber)
      setShowSetupModal(false)
      setDbEmpty(false)
    } catch (err: any) {
      console.error(
        '[createInitialAdmin] err:',
        err,
        'message:',
        err?.message,
        'stack:',
        err?.stack,
      )
      if (err instanceof Response) {
        const body = await err.json().catch(() => null)
        setSetupError(
          body?.message || body?.error || `Error HTTP ${err.status}`,
        )
      } else if (err?.message) {
        setSetupError(err.message)
      } else {
        setSetupError('Error al crear el administrador inicial.')
      }
    } finally {
      setSetupLoading(false)
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
          <img
            src="/logo-ligth.png"
            alt="Trainix Logo"
            className="h-40 w-auto mx-auto object-contain select-none pointer-events-none dark:hidden block"
          />
          <img
            src="/logo-dark.png"
            alt="Trainix Logo"
            className="h-40 w-auto mx-auto object-contain select-none pointer-events-none hidden dark:block"
          />
          <p className="text-sm text-muted-foreground ">
            Ingresá tus credenciales para acceder al sistema
          </p>
        </div>

        {dbEmpty && !showSetupModal && (
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center space-y-3 mb-5 animate-in fade-in duration-300">
            <p className="text-xs text-muted-foreground">
              No hay usuarios registrados en el sistema. Creá el administrador
              inicial para comenzar.
            </p>
            <Button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="w-full h-11 font-bold bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:hover:border-white"
            >
              Crear Administrador Inicial
            </Button>
          </div>
        )}

        {twoFactorRequired ? (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <Shield className="size-8 text-primary shrink-0" />
              <div>
                <p className="font-bold text-sm">Autenticación de dos factores</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ingresá el código de 6 dígitos desde tu app de autenticación.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Código de verificación
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex h-12 w-full rounded-xl border border-border/50 bg-background px-4 pl-11 text-center text-lg font-mono tracking-[0.3em] font-bold placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  autoFocus
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold transition-all bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:hover:border-white"
              disabled={totpCode.length !== 6 || twoFactorLoading}
            >
              {twoFactorLoading ? 'Verificando...' : 'Verificar código'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setTwoFactorRequired(false)
                setTotpCode('')
                setError('')
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        ) : showSetupModal ? (
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl"
                onClick={() => setShowSetupModal(false)}
                disabled={setupLoading}
              >
                <ArrowLeft className="size-3.5" /> Volver
              </Button>
            </div>

            {setupError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {setupError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="setup-name"
                className="text-sm font-medium text-foreground"
              >
                Nombre completo
              </Label>
              <Input
                id="setup-name"
                placeholder="Ej. Juan Pérez"
                value={setupForm.name}
                onChange={(e) =>
                  setSetupForm({
                    ...setupForm,
                    name: capitalizeEach(e.target.value),
                  })
                }
                required
                className="h-11 px-6"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="setup-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <Input
                id="setup-email"
                type="email"
                placeholder="Ej. admin@gym.local"
                value={setupForm.email}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, email: e.target.value })
                }
                required
                className="h-11 px-6"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="setup-doc"
                className="text-sm font-medium text-foreground"
              >
                Número de Documento (CI/DNI)
              </Label>
              <Input
                id="setup-doc"
                placeholder="Ej. 1234567"
                value={setupForm.documentNumber}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, documentNumber: e.target.value })
                }
                required
                className="h-11 px-6"
              />
              <p className="text-xs text-muted-foreground/80 px-1">
                Se usará como contraseña de inicio de sesión
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="setup-phone"
                className="text-sm font-medium text-foreground"
              >
                Teléfono (opcional)
              </Label>
              <div className="flex gap-2">
                <CountryCodeSelect
                  value={countryCode}
                  onValueChange={setCountryCode}
                  className="w-[130px] h-11 rounded-full shrink-0"
                />
                <Input
                  id="setup-phone"
                  placeholder="Ej. 70012345"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-11 px-6 flex-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="setup-address"
                className="text-sm font-medium text-foreground"
              >
                Dirección (opcional)
              </Label>
              <Input
                id="setup-address"
                placeholder="Ej. Av. Principal #123"
                value={setupForm.address}
                onChange={(e) =>
                  setSetupForm({
                    ...setupForm,
                    address: capitalizeEach(e.target.value),
                  })
                }
                className="h-11 px-6"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold transition-all bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:hover:border-white"
              disabled={setupLoading}
            >
              {setupLoading ? 'Creando...' : 'Crear Administrador'}
            </Button>
          </form>
        ) : (
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
                  onClick={() => navigate({ to: '/forgot-password' })}
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
              className="w-full h-11 font-semibold transition-all bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:hover:border-white"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>
        )}

        {!showSetupModal && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            Trainix v1.0
          </p>
        )}
      </div>
    </div>
  )
}
