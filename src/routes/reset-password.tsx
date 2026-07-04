import { useState, useEffect } from 'react'
import { createFileRoute, redirect, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Lock } from 'lucide-react'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Button } from '#/shared/components/ui/button'
import { authClient } from '#/shared/lib/auth-client.ts'
import { getSession } from '#/shared/lib/server-utils.ts'

const searchSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
})

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token, error: tokenError } = Route.useSearch()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)

  useEffect(() => {
    if (tokenError) {
      setInvalidToken(true)
      if (tokenError === 'INVALID_TOKEN') {
        setError('El enlace es inválido o expiró. Solicitá uno nuevo.')
      } else {
        setError('Error al validar el enlace. Solicitá uno nuevo.')
      }
    }
  }, [tokenError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres')
      return
    }
    if (!token) {
      setError('Token inválido. Solicitá un nuevo enlace.')
      return
    }

    setLoading(true)

    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (err) {
        setError(err.message ?? 'Error al restablecer la contraseña')
        return
      }

      setDone(true)
    } catch {
      setError('Error al restablecer la contraseña. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Contraseña actualizada</h1>
          <p className="text-sm text-muted-foreground">
            Tu contraseña se restableció correctamente. Ya podés iniciar sesión
            con tu nueva contraseña.
          </p>
          <Link
            to="/login"
            className="block w-full h-11 leading-[44px] font-semibold text-center bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:hover:border-white transition-all rounded-xl"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Crear nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresá tu nueva contraseña.
          </p>
        </div>

        {invalidToken ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span>{error || 'El enlace es inválido o expiró.'}</span>
            </div>
            <Link
              to="/forgot-password"
              className="block w-full h-11 leading-[44px] font-semibold text-center bg-black text-white border border-transparent hover:bg-white hover:text-black hover:border-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white dark:hover:border-white transition-all rounded-xl"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mín. 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={4}
                  required
                  className="h-11 pl-11 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repetí la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={4}
                  required
                  className="h-11 pl-11 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading || password.length < 4 || password !== confirmPassword}
            >
              {loading ? 'Actualizando...' : 'Restablecer contraseña'}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
